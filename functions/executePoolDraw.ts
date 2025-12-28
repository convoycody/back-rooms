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
    const draw = await base44.asServiceRole.entities.PoolDraw.get(draw_id);
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

    // Get all eligible tickets (purchased before cutoff)
    const allTickets = await base44.asServiceRole.entities.PoolTicket.filter({
      draw_id: draw_id,
      status: 'active'
    });

    const eligibleTickets = allTickets.filter(t => 
      new Date(t.created_date) <= new Date(draw.cutoff_at)
    );

    // Get config
    const configs = await base44.asServiceRole.entities.VaultConfig.list();
    const config = configs[0] || {};

    // Check minimum tickets
    if (eligibleTickets.length < (config.pool_min_tickets || 5)) {
      // Cancel and refund
      for (const ticket of eligibleTickets) {
        await base44.asServiceRole.entities.PoolTicket.update(ticket.id, {
          status: 'refunded'
        });

        const player = await base44.asServiceRole.entities.Player.get(ticket.player_id);
        const newVault = (player.vault_points || 0) + ticket.purchase_price;

        await base44.asServiceRole.entities.Player.update(ticket.player_id, {
          vault_points: newVault
        });

        await base44.asServiceRole.entities.VaultTransaction.create({
          player_id: ticket.player_id,
          transaction_type: 'ticket_refund',
          amount: ticket.purchase_price,
          vault_balance_before: player.vault_points || 0,
          vault_balance_after: newVault,
          spendable_balance_before: player.points_balance,
          spendable_balance_after: player.points_balance,
          related_ticket_id: ticket.id,
          related_draw_id: draw_id,
          note: 'Draw canceled - insufficient tickets'
        });
      }

      await base44.asServiceRole.entities.PoolDraw.update(draw_id, {
        status: 'canceled'
      });

      return Response.json({
        success: true,
        canceled: true,
        reason: 'Insufficient tickets',
        refunded: eligibleTickets.length
      });
    }

    // Generate seed if not exists
    let seedRevealed = draw.seed_revealed;
    if (!seedRevealed) {
      seedRevealed = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Sort ticket IDs for deterministic selection
    const sortedTicketIds = eligibleTickets.map(t => t.id).sort();

    // Hash-based winner selection
    const hashInput = seedRevealed + sortedTicketIds.join(',');
    const hash = createHash('sha256').update(hashInput).digest('hex');
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const winnerIndex = hashNum % sortedTicketIds.length;
    const winningTicketId = sortedTicketIds[winnerIndex];

    const winningTicket = eligibleTickets.find(t => t.id === winningTicketId);

    // Calculate payouts
    const totalPool = draw.total_pool;
    const winnerPayout = Math.floor(totalPool * 0.5);
    const houseAllocation = totalPool - winnerPayout;

    // Update winning ticket
    await base44.asServiceRole.entities.PoolTicket.update(winningTicket.id, {
      status: 'won',
      is_winner: true,
      payout_amount: winnerPayout
    });

    // Update losing tickets
    for (const ticket of eligibleTickets) {
      if (ticket.id !== winningTicket.id) {
        await base44.asServiceRole.entities.PoolTicket.update(ticket.id, {
          status: 'lost'
        });
      }
    }

    // Pay winner
    const winner = await base44.asServiceRole.entities.Player.get(winningTicket.player_id);
    const newVault = (winner.vault_points || 0) + winnerPayout;

    await base44.asServiceRole.entities.Player.update(winner.id, {
      vault_points: newVault
    });

    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: winner.id,
      transaction_type: 'draw_payout',
      amount: winnerPayout,
      vault_balance_before: winner.vault_points || 0,
      vault_balance_after: newVault,
      spendable_balance_before: winner.points_balance,
      spendable_balance_after: winner.points_balance,
      related_ticket_id: winningTicket.id,
      related_draw_id: draw_id,
      note: '50/50 Pool win'
    });

    // Count unique players
    const uniquePlayers = new Set(eligibleTickets.map(t => t.player_id)).size;

    // Update draw
    await base44.asServiceRole.entities.PoolDraw.update(draw_id, {
      status: 'executed',
      executed_at: new Date().toISOString(),
      winner_player_id: winner.id,
      winner_ticket_id: winningTicket.id,
      eligible_ticket_ids: sortedTicketIds,
      seed_revealed: seedRevealed,
      winner_payout: winnerPayout,
      house_allocation: houseAllocation,
      unique_players: uniquePlayers
    });

    // Create announcement if threshold met
    if (winnerPayout >= (config.announcement_threshold || 100000)) {
      const settings = await base44.asServiceRole.entities.PlayerSettings.filter({
        player_id: winner.id
      });
      const isPublic = settings.length > 0 ? settings[0].allow_public_wins !== false : true;

      await base44.asServiceRole.entities.Announcement.create({
        type: 'big_win',
        player_id: winner.id,
        display_name: winner.display_name,
        is_public: isPublic,
        game_id: 'pool-5050',
        game_name: '50/50 Pool',
        amount: winnerPayout,
        message: `${isPublic ? winner.display_name : 'A player'} won ${winnerPayout.toLocaleString()} points in the 50/50 Pool!`
      });
    }

    return Response.json({
      success: true,
      winner: {
        player_id: winner.id,
        display_name: winner.display_name,
        payout: winnerPayout
      },
      total_tickets: eligibleTickets.length,
      unique_players: uniquePlayers,
      total_pool: totalPool,
      house_allocation: houseAllocation
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});