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
    const config = configs[0] || { vault_enabled: true, min_deposit: 100, max_deposit: 100000 };

    if (!config.vault_enabled) {
      return Response.json({ error: 'Vault system is disabled' }, { status: 403 });
    }

    // Validate amount
    if (amount < config.min_deposit) {
      return Response.json({ 
        error: `Minimum deposit is ${config.min_deposit} points` 
      }, { status: 400 });
    }

    if (amount > config.max_deposit) {
      return Response.json({ 
        error: `Maximum deposit is ${config.max_deposit} points` 
      }, { status: 400 });
    }

    // Check sufficient balance
    if (player.points_balance < amount) {
      return Response.json({ 
        error: 'Insufficient spendable balance' 
      }, { status: 400 });
    }

    // Check account requirements
    if (config.require_min_account_age_days > 0) {
      const accountAge = (Date.now() - new Date(player.created_date).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAge < config.require_min_account_age_days) {
        return Response.json({ 
          error: `Account must be at least ${config.require_min_account_age_days} days old to use vault` 
        }, { status: 403 });
      }
    }

    if (config.require_min_activity_days > 0 && (player.active_days || 0) < config.require_min_activity_days) {
      return Response.json({ 
        error: `Must have at least ${config.require_min_activity_days} active days to use vault` 
      }, { status: 403 });
    }

    // Execute atomic deposit
    const newSpendable = player.points_balance - amount;
    const newVault = (player.vault_points || 0) + amount;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newSpendable,
      vault_points: newVault
    });

    // Create vault transaction record
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: player.id,
      transaction_type: 'deposit',
      amount: amount,
      vault_balance_before: player.vault_points || 0,
      vault_balance_after: newVault,
      spendable_balance_before: player.points_balance,
      spendable_balance_after: newSpendable,
      note: `Deposited ${amount} points to vault`
    });

    // Create ledger entry
    await base44.asServiceRole.entities.Ledger.create({
      player_id: player.id,
      change: 0, // Net zero for spendable (just moving to vault)
      reason: 'admin_adjustment',
      balance_after: newSpendable,
      note: `Vault deposit: ${amount} points`
    });

    // Process progression for vault deposit
    try {
      await base44.asServiceRole.functions.invoke('processPlayerProgression', {
        player_id: player.id,
        event_type: 'vault_deposit',
        event_data: { amount }
      });
    } catch (err) {
      console.error('Progression processing failed:', err);
    }

    return Response.json({
      success: true,
      spendable_balance: newSpendable,
      vault_balance: newVault,
      amount: amount
    });

  } catch (error) {
    console.error('Deposit error:', error);
    return Response.json({ 
      error: error.message || 'Failed to deposit to vault' 
    }, { status: 500 });
  }
});