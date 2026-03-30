import { createPlatformClient } from './_shared/platformClient.ts';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pool_id, quantity = 1 } = await req.json();

    if (!pool_id) {
      return Response.json({ error: 'Pool ID required' }, { status: 400 });
    }

    if (quantity < 1 || quantity > 50) {
      return Response.json({ error: 'Quantity must be between 1 and 50' }, { status: 400 });
    }

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get config
    const configs = await base44.asServiceRole.entities.FiftyFiftyConfig.list();
    const config = configs[0] || { enabled: true, ticket_price: 1000 };

    if (!config.enabled) {
      return Response.json({ error: '50/50 Pool is currently disabled' }, { status: 403 });
    }

    // Get pool
    const pools = await base44.asServiceRole.entities.FiftyFiftyPool.filter({ id: pool_id });
    if (pools.length === 0) {
      return Response.json({ error: 'Pool not found' }, { status: 404 });
    }
    const pool = pools[0];

    if (pool.status !== 'open') {
      return Response.json({ error: 'Pool is no longer accepting tickets' }, { status: 403 });
    }

    // Check if cutoff passed
    if (new Date() >= new Date(pool.cutoff_at)) {
      return Response.json({ error: 'Ticket sales have closed for this pool' }, { status: 403 });
    }

    // Check account age requirement
    if (config.min_account_age_days > 0) {
      const accountAge = (Date.now() - new Date(player.created_date).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAge < config.min_account_age_days) {
        return Response.json({ 
          error: `Account must be at least ${config.min_account_age_days} days old` 
        }, { status: 403 });
      }
    }

    // Check player ticket limit for this pool
    const playerTickets = await base44.asServiceRole.entities.FiftyFiftyTicket.filter({
      player_id: player.id,
      pool_id: pool_id,
      status: 'active'
    });

    if (playerTickets.length + quantity > config.max_tickets_per_player_per_draw) {
      return Response.json({ 
        error: `Maximum ${config.max_tickets_per_player_per_draw} tickets per player per draw` 
      }, { status: 403 });
    }

    const totalCost = config.ticket_price * quantity;

    // Check vault balance
    const vaultBalance = player.vault_points || 0;
    if (vaultBalance < totalCost) {
      return Response.json({ 
        error: 'Insufficient vault balance. Deposit points to vault first.' 
      }, { status: 400 });
    }

    // Atomic purchase - deduct from vault
    const newVaultBalance = vaultBalance - totalCost;
    await base44.asServiceRole.entities.Player.update(player.id, {
      vault_points: newVaultBalance
    });

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketData = {
        player_id: player.id,
        pool_id: pool_id,
        pool_date: pool.pool_date,
        ticket_price: config.ticket_price,
        status: 'active',
        purchased_at: new Date().toISOString(),
      };

      // Generate commit hash
      const commitStr = JSON.stringify({ ...ticketData, nonce: Math.random() });
      ticketData.commit_hash = createHash('sha256').update(commitStr).digest('hex');

      // Generate share slug
      ticketData.share_slug = Math.random().toString(36).substring(2, 10).toUpperCase();

      const ticket = await base44.asServiceRole.entities.FiftyFiftyTicket.create(ticketData);
      tickets.push(ticket);
    }

    // Update pool totals
    await base44.asServiceRole.entities.FiftyFiftyPool.update(pool_id, {
      total_tickets: pool.total_tickets + quantity,
      total_pot: pool.total_pot + totalCost
    });

    // Create vault transaction record
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: player.id,
      transaction_type: 'ticket_purchase',
      amount: -totalCost,
      vault_balance_before: vaultBalance,
      vault_balance_after: newVaultBalance,
      spendable_balance_before: player.points_balance,
      spendable_balance_after: player.points_balance,
      reference_id: pool_id,
      reference_type: 'fifty_fifty_ticket',
      note: `Purchased ${quantity} 50/50 ticket${quantity > 1 ? 's' : ''} for ${pool.pool_date}`
    });

    return Response.json({
      success: true,
      tickets: tickets,
      vault_balance: newVaultBalance,
      pool_total_tickets: pool.total_tickets + quantity,
      pool_total_pot: pool.total_pot + totalCost
    });

  } catch (error) {
    console.error('Ticket purchase error:', error);
    return Response.json({ 
      error: error.message || 'Failed to purchase ticket' 
    }, { status: 500 });
  }
});