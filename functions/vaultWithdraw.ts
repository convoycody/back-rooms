import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get config
    const configs = await base44.entities.VaultConfig.list();
    const config = configs[0] || {};

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Check vault balance
    if ((player.vault_points || 0) < amount) {
      return Response.json({ error: 'Insufficient vault balance' }, { status: 400 });
    }

    // Check cooldown
    if (player.last_vault_withdraw_at && config.withdraw_cooldown_hours) {
      const lastWithdraw = new Date(player.last_vault_withdraw_at);
      const now = new Date();
      const hoursSince = (now - lastWithdraw) / (1000 * 60 * 60);
      
      if (hoursSince < config.withdraw_cooldown_hours) {
        const hoursRemaining = Math.ceil(config.withdraw_cooldown_hours - hoursSince);
        return Response.json({ 
          error: `Withdrawal on cooldown. ${hoursRemaining}h remaining.` 
        }, { status: 429 });
      }
    }

    // Check daily limit
    if (config.daily_withdraw_limit) {
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = await base44.entities.VaultTransaction.filter({
        player_id: player.id,
        transaction_type: 'withdraw'
      });
      
      const todayTotal = todayTransactions
        .filter(t => t.created_date.startsWith(today))
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (todayTotal + amount > config.daily_withdraw_limit) {
        return Response.json({ 
          error: `Daily withdrawal limit exceeded. ${config.daily_withdraw_limit - todayTotal} remaining.` 
        }, { status: 429 });
      }
    }

    // Atomic update
    const newVault = player.vault_points - amount;
    const newSpendable = player.points_balance + amount;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newSpendable,
      vault_points: newVault,
      last_vault_withdraw_at: new Date().toISOString()
    });

    // Log transaction
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: player.id,
      transaction_type: 'withdraw',
      amount: amount,
      vault_balance_before: player.vault_points,
      vault_balance_after: newVault,
      spendable_balance_before: player.points_balance,
      spendable_balance_after: newSpendable,
      note: 'Vault withdrawal'
    });

    return Response.json({
      success: true,
      new_spendable: newSpendable,
      new_vault: newVault
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});