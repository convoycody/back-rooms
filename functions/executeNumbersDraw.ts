import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { draw_id } = await req.json();

    if (!draw_id) {
      return Response.json({ error: 'Draw ID required' }, { status: 400 });
    }

    const draws = await base44.asServiceRole.entities.NumbersLotteryDraw.filter({ id: draw_id });
    if (draws.length === 0) {
      return Response.json({ error: 'Draw not found' }, { status: 404 });
    }
    const draw = draws[0];

    // Idempotency
    if (draw.status === 'executed') {
      return Response.json({ message: 'Draw already executed' });
    }

    const configs = await base44.asServiceRole.entities.NumbersLotteryConfig.list();
    const config = configs[0];

    // Close draw
    await base44.asServiceRole.entities.NumbersLotteryDraw.update(draw_id, {
      status: 'closed'
    });

    // Generate winning numbers
    const seed = draw.seed_hash + Date.now();
    const seedHash = createHash('sha256').update(seed).digest('hex');
    
    const winningMain = [];
    for (let i = 0; i < config.main_numbers_count; i++) {
      const hash = createHash('sha256').update(seed + i).digest('hex');
      const num = (parseInt(hash.substring(0, 8), 16) % (config.main_numbers_max - config.main_numbers_min + 1)) + config.main_numbers_min;
      if (!winningMain.includes(num)) {
        winningMain.push(num);
      } else {
        i--;
      }
    }
    winningMain.sort((a, b) => a - b);

    const powerHash = createHash('sha256').update(seed + 'power').digest('hex');
    const winningPower = (parseInt(powerHash.substring(0, 8), 16) % (config.power_number_max - config.power_number_min + 1)) + config.power_number_min;

    // Get all tickets
    const tickets = await base44.asServiceRole.entities.NumbersLotteryTicket.filter({
      draw_id: draw_id,
      status: 'active'
    });

    // Calculate matches
    const tierCounts = {
      '5+power': 0,
      '5': 0,
      '4+power': 0,
      '4': 0,
      '3+power': 0
    };

    for (const ticket of tickets) {
      const mainMatches = ticket.main_numbers.filter(n => winningMain.includes(n)).length;
      const powerMatch = ticket.power_number === winningPower;

      let tier = null;
      if (mainMatches === 5 && powerMatch) tier = '5+power';
      else if (mainMatches === 5) tier = '5';
      else if (mainMatches === 4 && powerMatch) tier = '4+power';
      else if (mainMatches === 4) tier = '4';
      else if (mainMatches === 3 && powerMatch) tier = '3+power';

      if (tier) {
        tierCounts[tier]++;
        await base44.asServiceRole.entities.NumbersLotteryTicket.update(ticket.id, {
          matches_main: mainMatches,
          matches_power: powerMatch,
          win_tier: tier,
          status: 'winner'
        });
      } else {
        await base44.asServiceRole.entities.NumbersLotteryTicket.update(ticket.id, {
          matches_main: mainMatches,
          matches_power: powerMatch,
          status: 'loser'
        });
      }
    }

    // Calculate payouts (parimutuel)
    const totalPot = draw.total_pot + (draw.rollover_from_previous || 0);
    let remainingPot = totalPot;
    const payouts = {};

    const tiers = [
      { key: '5+power', pct: config.payout_tier_5_match_percentage },
      { key: '5', pct: config.payout_tier_5_percentage },
      { key: '4+power', pct: config.payout_tier_4_power_percentage },
      { key: '4', pct: config.payout_tier_4_percentage },
      { key: '3+power', pct: config.payout_tier_3_power_percentage }
    ];

    for (const tier of tiers) {
      const allocation = Math.floor(totalPot * (tier.pct / 100));
      if (tierCounts[tier.key] > 0) {
        payouts[tier.key] = Math.floor(allocation / tierCounts[tier.key]);
        remainingPot -= allocation;
      } else {
        payouts[tier.key] = 0;
      }
    }

    // Rollover if no top-tier winner
    let rolloverAmount = 0;
    if (config.rollover_enabled && tierCounts['5+power'] === 0) {
      rolloverAmount = Math.floor(totalPot * (config.payout_tier_5_match_percentage / 100));
    }

    // Pay winners
    for (const ticket of tickets) {
      if (ticket.win_tier && payouts[ticket.win_tier] > 0) {
        const payout = payouts[ticket.win_tier];
        
        const players = await base44.asServiceRole.entities.Player.filter({ id: ticket.player_id });
        if (players.length > 0) {
          const player = players[0];
          const newBalance = player.points_balance + payout;
          
          await base44.asServiceRole.entities.Player.update(player.id, {
            points_balance: newBalance,
            total_won: (player.total_won || 0) + payout,
            biggest_win: Math.max(player.biggest_win || 0, payout)
          });

          await base44.asServiceRole.entities.NumbersLotteryTicket.update(ticket.id, {
            payout: payout
          });

          await base44.asServiceRole.entities.VaultTransaction.create({
            player_id: player.id,
            transaction_type: 'draw_payout',
            amount: payout,
            vault_balance_before: player.vault_points || 0,
            vault_balance_after: player.vault_points || 0,
            spendable_balance_before: player.points_balance,
            spendable_balance_after: newBalance,
            reference_id: draw_id,
            reference_type: 'numbers_draw',
            note: `Numbers Lottery Win - ${ticket.win_tier} match`
          });

          await base44.asServiceRole.entities.Ledger.create({
            player_id: player.id,
            change: payout,
            reason: 'jackpot_win',
            balance_after: newBalance,
            note: `Numbers Lottery - ${ticket.win_tier} match`,
            is_shareable: true,
            share_slug: ticket.share_slug
          });

          // Announcement
          if (payout >= config.announcement_threshold) {
            const playerSettings = await base44.asServiceRole.entities.PlayerSettings.filter({ player_id: player.id });
            const allowPublic = playerSettings.length === 0 || playerSettings[0].allow_public_announcements;

            await base44.asServiceRole.entities.Announcement.create({
              type: 'jackpot',
              player_id: player.id,
              display_name: player.display_name,
              is_public: allowPublic,
              game_id: 'numbers-lottery',
              game_name: 'Numbers Lottery',
              amount: payout,
              message: `${allowPublic ? player.display_name : 'Someone'} won ${payout.toLocaleString()} points with ${ticket.win_tier} match!`,
              metadata: { tier: ticket.win_tier }
            });
          }
        }
      }
    }

    // Update draw results
    await base44.asServiceRole.entities.NumbersLotteryDraw.update(draw_id, {
      status: 'executed',
      winning_main_numbers: winningMain,
      winning_power_number: winningPower,
      seed_revealed: seed,
      tier_5_match_winners: tierCounts['5+power'],
      tier_5_match_payout_each: payouts['5+power'],
      tier_5_winners: tierCounts['5'],
      tier_5_payout_each: payouts['5'],
      tier_4_power_winners: tierCounts['4+power'],
      tier_4_power_payout_each: payouts['4+power'],
      tier_4_winners: tierCounts['4'],
      tier_4_payout_each: payouts['4'],
      tier_3_power_winners: tierCounts['3+power'],
      tier_3_power_payout_each: payouts['3+power'],
      rollover_to_next: rolloverAmount,
      executed_at: new Date().toISOString()
    });

    // Update config rollover
    if (rolloverAmount > 0) {
      await base44.asServiceRole.entities.NumbersLotteryConfig.update(config.id, {
        rollover_pot: (config.rollover_pot || 0) + rolloverAmount
      });
    }

    return Response.json({
      success: true,
      winning_numbers: { main: winningMain, power: winningPower },
      winners: tierCounts,
      payouts: payouts,
      rollover: rolloverAmount
    });

  } catch (error) {
    console.error('Draw error:', error);
    return Response.json({ error: error.message || 'Failed to execute' }, { status: 500 });
  }
});