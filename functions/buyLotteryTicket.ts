import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draw_id, numbers, power_number, use_vault, quick_pick } = await req.json();

    if (!draw_id) {
      return Response.json({ error: 'Draw ID required' }, { status: 400 });
    }

    // Get draw
    const draw = await base44.entities.LotteryDraw.get(draw_id);
    if (!draw) {
      return Response.json({ error: 'Draw not found' }, { status: 404 });
    }

    // Check if draw is open
    if (draw.status !== 'open') {
      return Response.json({ error: 'Draw is not open for tickets' }, { status: 400 });
    }

    // Check cutoff
    if (new Date() >= new Date(draw.cutoff_at)) {
      return Response.json({ error: 'Ticket sales closed' }, { status: 400 });
    }

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get config
    const configs = await base44.entities.VaultConfig.list();
    const config = configs[0] || {};

    // Check max tickets per player
    if (config.lottery_max_tickets_per_player) {
      const existingTickets = await base44.entities.LotteryTicket.filter({
        player_id: player.id,
        draw_id: draw_id
      });
      
      if (existingTickets.length >= config.lottery_max_tickets_per_player) {
        return Response.json({ 
          error: `Max ${config.lottery_max_tickets_per_player} tickets per player` 
        }, { status: 400 });
      }
    }

    // Generate numbers if quick pick
    let finalNumbers = numbers;
    let finalPower = power_number;

    if (quick_pick) {
      // Generate 5 unique numbers between 1-69
      const nums = [];
      while (nums.length < 5) {
        const num = Math.floor(Math.random() * 69) + 1;
        if (!nums.includes(num)) nums.push(num);
      }
      finalNumbers = nums.sort((a, b) => a - b);
      
      // Generate power number between 1-26
      finalPower = Math.floor(Math.random() * 26) + 1;
    } else {
      // Validate numbers
      if (!numbers || numbers.length !== 5) {
        return Response.json({ error: '5 numbers required' }, { status: 400 });
      }
      
      if (!power_number || power_number < 1 || power_number > 26) {
        return Response.json({ error: 'Power number must be 1-26' }, { status: 400 });
      }
      
      for (const num of numbers) {
        if (num < 1 || num > 69) {
          return Response.json({ error: 'Numbers must be 1-69' }, { status: 400 });
        }
      }
      
      // Check for duplicates
      if (new Set(numbers).size !== 5) {
        return Response.json({ error: 'Numbers must be unique' }, { status: 400 });
      }
    }

    const ticketPrice = draw.ticket_price;

    // Check balance
    if (use_vault) {
      if ((player.vault_points || 0) < ticketPrice) {
        return Response.json({ error: 'Insufficient vault balance' }, { status: 400 });
      }
    } else {
      if (player.points_balance < ticketPrice) {
        return Response.json({ error: 'Insufficient spendable balance' }, { status: 400 });
      }
    }

    // Get next ticket number
    const existingTickets = await base44.entities.LotteryTicket.filter({ draw_id: draw_id });
    const ticketNumber = existingTickets.length + 1;

    // Create ticket
    const ticket = await base44.asServiceRole.entities.LotteryTicket.create({
      player_id: player.id,
      draw_id: draw_id,
      ticket_number: ticketNumber,
      purchase_price: ticketPrice,
      numbers: finalNumbers,
      power_number: finalPower,
      is_quick_pick: quick_pick || false,
      status: 'active',
      commit_hash: Math.random().toString(36)
    });

    // Deduct balance
    if (use_vault) {
      const newVault = player.vault_points - ticketPrice;
      await base44.asServiceRole.entities.Player.update(player.id, {
        vault_points: newVault
      });

      await base44.asServiceRole.entities.VaultTransaction.create({
        player_id: player.id,
        transaction_type: 'ticket_purchase',
        amount: ticketPrice,
        vault_balance_before: player.vault_points,
        vault_balance_after: newVault,
        spendable_balance_before: player.points_balance,
        spendable_balance_after: player.points_balance,
        related_ticket_id: ticket.id,
        related_draw_id: draw_id,
        note: 'Lottery ticket'
      });
    } else {
      const newSpendable = player.points_balance - ticketPrice;
      await base44.asServiceRole.entities.Player.update(player.id, {
        points_balance: newSpendable
      });

      await base44.asServiceRole.entities.VaultTransaction.create({
        player_id: player.id,
        transaction_type: 'ticket_purchase',
        amount: ticketPrice,
        vault_balance_before: player.vault_points || 0,
        vault_balance_after: player.vault_points || 0,
        spendable_balance_before: player.points_balance,
        spendable_balance_after: newSpendable,
        related_ticket_id: ticket.id,
        related_draw_id: draw_id,
        note: 'Lottery ticket'
      });
    }

    // Update draw pool
    await base44.asServiceRole.entities.LotteryDraw.update(draw_id, {
      total_pool: draw.total_pool + ticketPrice,
      total_tickets_sold: (draw.total_tickets_sold || 0) + 1
    });

    return Response.json({
      success: true,
      ticket: ticket
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});