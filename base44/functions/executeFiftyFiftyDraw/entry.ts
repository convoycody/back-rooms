import { createPlatformClient } from './_shared/platformClient.ts';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const { pool_id } = await req.json();

    if (!pool_id) {
      return Response.json({ error: 'Pool ID required' }, { status: 400 });
    }

    // Get pool
    const pools = await base44.asServiceRole.entities.FiftyFiftyPool.filter({ id: pool_id });
    if (pools.length === 0) {
      return Response.json({ error: 'Pool not found' }, { status: 404 });
    }
    const pool = pools[0];

    // Idempotency check
    if (pool.status === 'executed') {
      return Response.json({ 
        message: 'Draw already executed',
        winner: pool.winner_display_name,
        payout: pool.winner_share
      });
    }

    if (pool.status === 'cancelled') {
      return Response.json({ error: 'Pool was cancelled' }, { status: 400 });
    }

    // Get config
    const configs = await base44.asServiceRole.entities.FiftyFiftyConfig.list();
    const config = configs[0] || { min_pool_size: 5 };

    // Check if minimum pool size met
    if (pool.total_tickets < config.min_pool_size) {
      // Cancel and refund
      await base44.asServiceRole.entities.FiftyFiftyPool.update(pool_id, {
        status: 'cancelled',
        failure_reason: `Minimum pool size not met (${pool.total_tickets}/${config.min_pool_size})`
      });

      // Refund all tickets
      const tickets = await base44.asServiceRole.entities.FiftyFiftyTicket.filter({
        pool_id: pool_id,
        status: 'active'
      });

      for (const ticket of tickets) {
        const players = await base44.asServiceRole.entities.Player.filter({ id: ticket.player_id });
        if (players.length > 0) {
          const player = players[0];
          
          // Refund to vault
          await base44.asServiceRole.entities.Player.update(player.id, {
            vault_points: (player.vault_points || 0) + ticket.ticket_price
          });

          // Mark ticket as refunded
          await base44.asServiceRole.entities.FiftyFiftyTicket.update(ticket.id, {
            status: 'refunded'
          });

          // Create vault transaction
          await base44.asServiceRole.entities.VaultTransaction.create({
            player_id: player.id,
            transaction_type: 'ticket_refund',
            amount: ticket.ticket_price,
            vault_balance_before: player.vault_points - ticket.ticket_price,
            vault_balance_after: player.vault_points,
            spendable_balance_before: player.points_balance,
            spendable_balance_after: player.points_balance,
            reference_id: pool_id,
            reference_type: 'fifty_fifty_draw',
            note: `Refund: Pool ${pool.pool_date} cancelled (minimum size not met)`
          });
        }
      }

      return Response.json({ 
        message: 'Pool cancelled and all tickets refunded',
        reason: 'Minimum pool size not met'
      });
    }

    // Close pool and get eligible tickets
    await base44.asServiceRole.entities.FiftyFiftyPool.update(pool_id, {
      status: 'closed'
    });

    const eligibleTickets = await base44.asServiceRole.entities.FiftyFiftyTicket.filter({
      pool_id: pool_id,
      status: 'active'
    });

    if (eligibleTickets.length === 0) {
      await base44.asServiceRole.entities.FiftyFiftyPool.update(pool_id, {
        status: 'cancelled',
        failure_reason: 'No eligible tickets found'
      });
      return Response.json({ error: 'No eligible tickets' }, { status: 400 });
    }

    // Sort tickets by ID for deterministic ordering
    const sortedTickets = eligibleTickets.sort((a, b) => a.id.localeCompare(b.id));
    const ticketIds = sortedTickets.map(t => t.id);

    // Reveal seed (use pool seed_hash as seed for now - in production use pre-committed seed)
    const seed = pool.seed_hash + Date.now();
    const seedHash = createHash('sha256').update(seed).digest('hex');

    // Select winner using hash
    const hashValue = parseInt(seedHash.substring(0, 8), 16);
    const winningIndex = hashValue % sortedTickets.length;
    const winningTicket = sortedTickets[winningIndex];

    // Calculate payouts
    const winnerShare = Math.floor(pool.total_pot * 0.5);
    const houseShare = pool.total_pot - winnerShare;

    // Apply payout cap if configured
    let finalWinnerShare = winnerShare;
    if (config.max_pool_payout_cap > 0 && winnerShare > config.max_pool_payout_cap) {
      finalWinnerShare = config.max_pool_payout_cap;
    }

    // Get winner player
    const winnerPlayers = await base44.asServiceRole.entities.Player.filter({ id: winningTicket.player_id });
    if (winnerPlayers.length === 0) {
      throw new Error('Winner player not found');
    }
    const winner = winnerPlayers[0];

    // Pay winner (to spendable balance)
    const newSpendableBalance = winner.points_balance + finalWinnerShare;
    await base44.asServiceRole.entities.Player.update(winner.id, {
      points_balance: newSpendableBalance,
      total_won: (winner.total_won || 0) + finalWinnerShare,
      biggest_win: Math.max(winner.biggest_win || 0, finalWinnerShare)
    });

    // Mark winning ticket
    await base44.asServiceRole.entities.FiftyFiftyTicket.update(winningTicket.id, {
      status: 'won',
      is_winner: true,
      payout: finalWinnerShare
    });

    // Mark losing tickets
    for (const ticket of sortedTickets) {
      if (ticket.id !== winningTicket.id) {
        await base44.asServiceRole.entities.FiftyFiftyTicket.update(ticket.id, {
          status: 'lost'
        });
      }
    }

    // Update pool with results
    await base44.asServiceRole.entities.FiftyFiftyPool.update(pool_id, {
      status: 'executed',
      seed_revealed: seed,
      winner_player_id: winner.id,
      winner_display_name: winner.display_name,
      winner_ticket_id: winningTicket.id,
      winning_index: winningIndex,
      winner_share: finalWinnerShare,
      house_share: houseShare,
      eligible_ticket_ids: ticketIds,
      executed_at: new Date().toISOString()
    });

    // Create vault transaction for winner
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: winner.id,
      transaction_type: 'draw_payout',
      amount: finalWinnerShare,
      vault_balance_before: winner.vault_points || 0,
      vault_balance_after: winner.vault_points || 0,
      spendable_balance_before: winner.points_balance,
      spendable_balance_after: newSpendableBalance,
      reference_id: pool_id,
      reference_type: 'fifty_fifty_draw',
      note: `50/50 Pool Win - ${pool.pool_date}`
    });

    // Create ledger entry
    await base44.asServiceRole.entities.Ledger.create({
      player_id: winner.id,
      change: finalWinnerShare,
      reason: 'jackpot_win',
      balance_after: newSpendableBalance,
      note: `50/50 Pool Winner - ${pool.pool_date}`,
      is_shareable: true,
      share_slug: winningTicket.share_slug
    });

    // Create announcement if above threshold
    const playerSettings = await base44.asServiceRole.entities.PlayerSettings.filter({ player_id: winner.id });
    const allowPublic = playerSettings.length === 0 || playerSettings[0].allow_public_announcements;

    if (finalWinnerShare >= (config.announcement_threshold || 10000)) {
      await base44.asServiceRole.entities.Announcement.create({
        type: 'jackpot',
        player_id: winner.id,
        display_name: winner.display_name,
        is_public: allowPublic,
        game_id: 'fifty-fifty',
        game_name: '50/50 Pool',
        amount: finalWinnerShare,
        message: `${allowPublic ? winner.display_name : 'Someone'} won ${finalWinnerShare.toLocaleString()} points in the 50/50 Pool!`,
        metadata: {
          pool_date: pool.pool_date,
          total_tickets: pool.total_tickets,
          total_pot: pool.total_pot
        }
      });
    }

    return Response.json({
      success: true,
      winner: {
        player_id: winner.id,
        display_name: winner.display_name,
        payout: finalWinnerShare
      },
      pool: {
        total_tickets: pool.total_tickets,
        total_pot: pool.total_pot,
        winner_share: finalWinnerShare,
        house_share: houseShare
      },
      proof: {
        seed_hash: seedHash,
        winning_index: winningIndex,
        total_tickets: sortedTickets.length
      }
    });

  } catch (error) {
    console.error('Draw execution error:', error);
    return Response.json({ 
      error: error.message || 'Failed to execute draw' 
    }, { status: 500 });
  }
});