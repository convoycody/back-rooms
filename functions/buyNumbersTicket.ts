import { createPlatformClient } from './_shared/platformClient.ts';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draw_id, main_numbers, power_number, is_quick_pick } = await req.json();

    if (!draw_id) {
      return Response.json({ error: 'Draw ID required' }, { status: 400 });
    }

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get config
    const configs = await base44.asServiceRole.entities.NumbersLotteryConfig.list();
    const config = configs[0] || { enabled: true, ticket_price: 2000 };

    if (!config.enabled) {
      return Response.json({ error: 'Numbers Lottery is disabled' }, { status: 403 });
    }

    // Get draw
    const draws = await base44.asServiceRole.entities.NumbersLotteryDraw.filter({ id: draw_id });
    if (draws.length === 0) {
      return Response.json({ error: 'Draw not found' }, { status: 404 });
    }
    const draw = draws[0];

    if (draw.status !== 'open') {
      return Response.json({ error: 'Draw is closed' }, { status: 403 });
    }

    if (new Date() >= new Date(draw.cutoff_at)) {
      return Response.json({ error: 'Sales have closed' }, { status: 403 });
    }

    // Validate numbers
    if (!main_numbers || main_numbers.length !== config.main_numbers_count) {
      return Response.json({ error: `Must pick ${config.main_numbers_count} main numbers` }, { status: 400 });
    }

    const sortedMain = [...main_numbers].sort((a, b) => a - b);
    const uniqueMain = [...new Set(sortedMain)];
    if (uniqueMain.length !== config.main_numbers_count) {
      return Response.json({ error: 'Main numbers must be unique' }, { status: 400 });
    }

    for (const num of sortedMain) {
      if (num < config.main_numbers_min || num > config.main_numbers_max) {
        return Response.json({ error: `Main numbers must be ${config.main_numbers_min}-${config.main_numbers_max}` }, { status: 400 });
      }
    }

    if (power_number < config.power_number_min || power_number > config.power_number_max) {
      return Response.json({ error: `Power number must be ${config.power_number_min}-${config.power_number_max}` }, { status: 400 });
    }

    // Check account age
    if (config.min_account_age_days > 0) {
      const accountAge = (Date.now() - new Date(player.created_date).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAge < config.min_account_age_days) {
        return Response.json({ error: `Account must be at least ${config.min_account_age_days} days old` }, { status: 403 });
      }
    }

    // Check ticket limit
    const playerTickets = await base44.asServiceRole.entities.NumbersLotteryTicket.filter({
      player_id: player.id,
      draw_id: draw_id,
      status: 'active'
    });

    if (playerTickets.length >= config.max_tickets_per_player_per_draw) {
      return Response.json({ error: `Maximum ${config.max_tickets_per_player_per_draw} tickets per draw` }, { status: 403 });
    }

    // Check vault balance
    const vaultBalance = player.vault_points || 0;
    if (vaultBalance < config.ticket_price) {
      return Response.json({ error: 'Insufficient vault balance' }, { status: 400 });
    }

    // Deduct from vault
    const newVaultBalance = vaultBalance - config.ticket_price;
    await base44.asServiceRole.entities.Player.update(player.id, {
      vault_points: newVaultBalance
    });

    // Create ticket
    const ticketData = {
      player_id: player.id,
      draw_id: draw_id,
      draw_date: draw.draw_date,
      ticket_price: config.ticket_price,
      main_numbers: sortedMain,
      power_number: power_number,
      is_quick_pick: is_quick_pick || false,
      status: 'active',
      purchased_at: new Date().toISOString(),
    };

    const commitStr = JSON.stringify({ ...ticketData, nonce: Math.random() });
    ticketData.commit_hash = createHash('sha256').update(commitStr).digest('hex');
    ticketData.share_slug = Math.random().toString(36).substring(2, 10).toUpperCase();

    const ticket = await base44.asServiceRole.entities.NumbersLotteryTicket.create(ticketData);

    // Update draw totals
    await base44.asServiceRole.entities.NumbersLotteryDraw.update(draw_id, {
      total_tickets: draw.total_tickets + 1,
      total_pot: draw.total_pot + config.ticket_price
    });

    // Create vault transaction
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: player.id,
      transaction_type: 'ticket_purchase',
      amount: -config.ticket_price,
      vault_balance_before: vaultBalance,
      vault_balance_after: newVaultBalance,
      spendable_balance_before: player.points_balance,
      spendable_balance_after: player.points_balance,
      reference_id: draw_id,
      reference_type: 'numbers_ticket',
      note: `Numbers Lottery ticket for ${draw.draw_date}`
    });

    return Response.json({
      success: true,
      ticket: ticket,
      vault_balance: newVaultBalance
    });

  } catch (error) {
    console.error('Ticket purchase error:', error);
    return Response.json({ error: error.message || 'Failed to purchase' }, { status: 500 });
  }
});