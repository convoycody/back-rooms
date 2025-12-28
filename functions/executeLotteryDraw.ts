import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin only
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0 || !players[0].is_admin) {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { draw_id } = await req.json();

    if (!draw_id) {
      return Response.json({ error: 'Draw ID required' }, { status: 400 });
    }

    // Get draw
    const draw = await base44.asServiceRole.entities.LotteryDraw.get(draw_id);
    if (!draw) {
      return Response.json({ error: 'Draw not found' }, { status: 404 });
    }

    // Check if already executed (idempotency)
    if (draw.status === 'executed') {
      return Response.json({ 
        message: 'Draw already executed',
        draw: draw 
      });
    }

    // Check if past cutoff
    if (new Date() < new Date(draw.cutoff_at)) {
      return Response.json({ error: 'Draw cutoff not reached' }, { status: 400 });
    }

    // Get all eligible tickets
    const allTickets = await base44.asServiceRole.entities.LotteryTicket.filter({
      draw_id: draw_id,
      status: 'active'
    });

    const eligibleTickets = allTickets.filter(t => 
      new Date(t.created_date) <= new Date(draw.cutoff_at)
    );

    if (eligibleTickets.length === 0) {
      await base44.asServiceRole.entities.LotteryDraw.update(draw_id, {
        status: 'canceled'
      });
      return Response.json({
        success: true,
        canceled: true,
        reason: 'No tickets sold'
      });
    }

    // Generate seed if not exists
    let seedRevealed = draw.seed_revealed;
    if (!seedRevealed) {
      seedRevealed = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Generate winning numbers using seed
    const hash1 = createHash('sha256').update(seedRevealed + 'numbers').digest('hex');
    const winningNumbers = [];
    for (let i = 0; i < 5; i++) {
      const slice = hash1.substring(i * 4, i * 4 + 4);
      const num = (parseInt(slice, 16) % 69) + 1;
      if (!winningNumbers.includes(num)) {
        winningNumbers.push(num);
      } else {
        i--; // retry
      }
    }
    winningNumbers.sort((a, b) => a - b);

    const hash2 = createHash('sha256').update(seedRevealed + 'power').digest('hex');
    const powerNumber = (parseInt(hash2.substring(0, 4), 16) % 26) + 1;

    // Get config
    const configs = await base44.asServiceRole.entities.VaultConfig.list();
    const config = configs[0] || {};

    // Calculate matches for each ticket
    const winnersByTier = {
      jackpot: [],
      match5: [],
      match4_power: [],
      match4: [],
      match3_power: [],
      match3: [],
      match2_power: [],
      match1_power: [],
      power_only: []
    };

    for (const ticket of eligibleTickets) {
      const matches = ticket.numbers.filter(n => winningNumbers.includes(n)).length;
      const powerMatch = ticket.power_number === powerNumber;

      let tier = null;
      if (matches === 5 && powerMatch) tier = 'jackpot';
      else if (matches === 5) tier = 'match5';
      else if (matches === 4 && powerMatch) tier = 'match4_power';
      else if (matches === 4) tier = 'match4';
      else if (matches === 3 && powerMatch) tier = 'match3_power';
      else if (matches === 3) tier = 'match3';
      else if (matches === 2 && powerMatch) tier = 'match2_power';
      else if (matches === 1 && powerMatch) tier = 'match1_power';
      else if (powerMatch) tier = 'power_only';

      await base44.asServiceRole.entities.LotteryTicket.update(ticket.id, {
        matches: matches,
        power_match: powerMatch,
        prize_tier: tier,
        status: tier ? 'won' : 'lost'
      });

      if (tier) {
        winnersByTier[tier].push(ticket);
      }
    }

    // Calculate payouts (parimutuel)
    const totalPool = draw.total_pool + (draw.rollover_from_previous || 0);
    
    const payoutsByTier = {
      jackpot: 0,
      match5: 0,
      match4_power: 0,
      match4: 0,
      match3_power: 0,
      match3: 0,
      match2_power: 0,
      match1_power: 0,
      power_only: 0
    };

    const tierPcts = {
      jackpot: config.lottery_jackpot_pool_pct || 50,
      match5: config.lottery_match5_pool_pct || 20,
      match4_power: config.lottery_match4_power_pool_pct || 10,
      match4: config.lottery_match4_pool_pct || 5,
      match3_power: config.lottery_match3_power_pool_pct || 5,
      match3: config.lottery_match3_pool_pct || 3,
      match2_power: config.lottery_match2_power_pool_pct || 3,
      match1_power: config.lottery_match1_power_pool_pct || 2,
      power_only: config.lottery_power_only_pool_pct || 2
    };

    let rolloverToNext = 0;

    for (const tier in winnersByTier) {
      const winners = winnersByTier[tier];
      const tierPool = Math.floor(totalPool * (tierPcts[tier] / 100));

      if (winners.length > 0) {
        const payoutPerWinner = Math.floor(tierPool / winners.length);
        payoutsByTier[tier] = payoutPerWinner;

        // Pay winners
        for (const ticket of winners) {
          await base44.asServiceRole.entities.LotteryTicket.update(ticket.id, {
            payout_amount: payoutPerWinner
          });

          const player = await base44.asServiceRole.entities.Player.get(ticket.player_id);
          const newVault = (player.vault_points || 0) + payoutPerWinner;

          await base44.asServiceRole.entities.Player.update(player.id, {
            vault_points: newVault
          });

          await base44.asServiceRole.entities.VaultTransaction.create({
            player_id: player.id,
            transaction_type: 'draw_payout',
            amount: payoutPerWinner,
            vault_balance_before: player.vault_points || 0,
            vault_balance_after: newVault,
            spendable_balance_before: player.points_balance,
            spendable_balance_after: player.points_balance,
            related_ticket_id: ticket.id,
            related_draw_id: draw_id,
            note: `Lottery win - ${tier}`
          });

          // Create announcement if threshold met
          if (payoutPerWinner >= (config.announcement_threshold || 100000)) {
            const settings = await base44.asServiceRole.entities.PlayerSettings.filter({
              player_id: player.id
            });
            const isPublic = settings.length > 0 ? settings[0].allow_public_wins !== false : true;

            await base44.asServiceRole.entities.Announcement.create({
              type: tier === 'jackpot' ? 'jackpot' : 'big_win',
              player_id: player.id,
              display_name: player.display_name,
              is_public: isPublic,
              game_id: 'lottery',
              game_name: 'Vault Lottery',
              amount: payoutPerWinner,
              message: `${isPublic ? player.display_name : 'A player'} won ${payoutPerWinner.toLocaleString()} points in Vault Lottery (${tier})!`
            });
          }
        }
      } else if (tier === 'jackpot' && config.lottery_rollover_enabled) {
        // Rollover jackpot if no winner
        rolloverToNext += tierPool;
      }
    }

    // Count unique players
    const uniquePlayers = new Set(eligibleTickets.map(t => t.player_id)).size;

    // Update draw
    await base44.asServiceRole.entities.LotteryDraw.update(draw_id, {
      status: 'executed',
      executed_at: new Date().toISOString(),
      winning_numbers: winningNumbers,
      power_number: powerNumber,
      seed_revealed: seedRevealed,
      jackpot_winners: winnersByTier.jackpot.length,
      match5_winners: winnersByTier.match5.length,
      match4_power_winners: winnersByTier.match4_power.length,
      match4_winners: winnersByTier.match4.length,
      match3_power_winners: winnersByTier.match3_power.length,
      match3_winners: winnersByTier.match3.length,
      match2_power_winners: winnersByTier.match2_power.length,
      match1_power_winners: winnersByTier.match1_power.length,
      power_only_winners: winnersByTier.power_only.length,
      jackpot_payout_per_winner: payoutsByTier.jackpot,
      match5_payout: payoutsByTier.match5,
      match4_power_payout: payoutsByTier.match4_power,
      match4_payout: payoutsByTier.match4,
      match3_power_payout: payoutsByTier.match3_power,
      match3_payout: payoutsByTier.match3,
      match2_power_payout: payoutsByTier.match2_power,
      match1_power_payout: payoutsByTier.match1_power,
      power_only_payout: payoutsByTier.power_only,
      rollover_to_next: rolloverToNext,
      unique_players: uniquePlayers
    });

    return Response.json({
      success: true,
      winning_numbers: winningNumbers,
      power_number: powerNumber,
      total_tickets: eligibleTickets.length,
      unique_players: uniquePlayers,
      winners_by_tier: Object.fromEntries(
        Object.entries(winnersByTier).map(([k, v]) => [k, v.length])
      ),
      payouts: payoutsByTier,
      rollover: rolloverToNext
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});