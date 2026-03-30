import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get vault config
    const configs = await base44.asServiceRole.entities.VaultConfig.list();
    const config = configs[0] || { 
      vault_enabled: true, 
      min_withdraw: 100, 
      withdraw_cooldown_minutes: 60,
      max_withdrawals_per_day: 5
    };

    if (!config.vault_enabled) {
      return Response.json({ error: 'Vault system is disabled' }, { status: 403 });
    }

    // Validate amount
    if (amount < config.min_withdraw) {
      return Response.json({ 
        error: `Minimum withdrawal is ${config.min_withdraw} points` 
      }, { status: 400 });
    }

    // Check vault balance
    const vaultBalance = player.vault_points || 0;
    if (vaultBalance < amount) {
      return Response.json({ 
        error: 'Insufficient vault balance' 
      }, { status: 400 });
    }

    // Check cooldown
    if (player.last_vault_withdraw_at) {
      const lastWithdraw = new Date(player.last_vault_withdraw_at);
      const cooldownMs = config.withdraw_cooldown_minutes * 60 * 1000;
      const timeSinceLastWithdraw = Date.now() - lastWithdraw.getTime();
      
      if (timeSinceLastWithdraw < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastWithdraw) / 60000);
        return Response.json({ 
          error: `Withdrawal cooldown active. Wait ${remainingMinutes} more minutes.`,
          cooldown_remaining_seconds: Math.ceil((cooldownMs - timeSinceLastWithdraw) / 1000)
        }, { status: 429 });
      }
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const lastWithdrawDate = player.last_vault_withdraw_date;
    let withdrawalsToday = player.vault_withdrawals_today || 0;

    if (lastWithdrawDate !== today) {
      withdrawalsToday = 0;
    }

    if (withdrawalsToday >= config.max_withdrawals_per_day) {
      return Response.json({ 
        error: `Maximum ${config.max_withdrawals_per_day} withdrawals per day reached` 
      }, { status: 429 });
    }

    // Execute atomic withdrawal
    const newVault = vaultBalance - amount;
    const newSpendable = player.points_balance + amount;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newSpendable,
      vault_points: newVault,
      last_vault_withdraw_at: new Date().toISOString(),
      last_vault_withdraw_date: today,
      vault_withdrawals_today: withdrawalsToday + 1
    });

    // Create vault transaction record
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: player.id,
      transaction_type: 'withdraw',
      amount: -amount,
      vault_balance_before: vaultBalance,
      vault_balance_after: newVault,
      spendable_balance_before: player.points_balance,
      spendable_balance_after: newSpendable,
      note: `Withdrew ${amount} points from vault`
    });

    // Create ledger entry
    await base44.asServiceRole.entities.Ledger.create({
      player_id: player.id,
      change: 0, // Net zero for spendable (just moving from vault)
      reason: 'admin_adjustment',
      balance_after: newSpendable,
      note: `Vault withdrawal: ${amount} points`
    });

    return Response.json({
      success: true,
      spendable_balance: newSpendable,
      vault_balance: newVault,
      amount: amount,
      withdrawals_remaining_today: config.max_withdrawals_per_day - (withdrawalsToday + 1)
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return Response.json({ 
      error: error.message || 'Failed to withdraw from vault' 
    }, { status: 500 });
  }
});