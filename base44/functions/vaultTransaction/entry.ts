import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id, action, amount } = await req.json();

    if (!player_id || !action || !amount || amount <= 0) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get or create vault account
    let vaultAccounts = await base44.asServiceRole.entities.VaultAccount.filter({ player_id });
    let vaultAccount;
    
    if (vaultAccounts.length === 0) {
      vaultAccount = await base44.asServiceRole.entities.VaultAccount.create({
        player_id,
        vault_balance: 0,
        total_deposited: 0,
        total_withdrawn: 0
      });
    } else {
      vaultAccount = vaultAccounts[0];
    }

    if (action === 'deposit') {
      // Check player has enough balance
      if (player.points_balance < amount) {
        return Response.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      // Move points: spendable → vault
      await base44.asServiceRole.entities.Player.update(player_id, {
        points_balance: player.points_balance - amount
      });

      await base44.asServiceRole.entities.VaultAccount.update(vaultAccount.id, {
        vault_balance: vaultAccount.vault_balance + amount,
        total_deposited: (vaultAccount.total_deposited || 0) + amount,
        last_deposit_at: new Date().toISOString()
      });

      // Log transaction
      await base44.asServiceRole.entities.Ledger.create({
        player_id,
        change: -amount,
        reason: 'admin_adjustment',
        balance_after: player.points_balance - amount,
        note: 'Vault deposit'
      });

      await base44.asServiceRole.entities.VaultAuditLog.create({
        player_id,
        action_type: 'vault_deposit',
        amount,
        note: `Deposited ${amount} points to vault`
      });

      return Response.json({ 
        success: true, 
        vault_balance: vaultAccount.vault_balance + amount,
        points_balance: player.points_balance - amount
      });

    } else if (action === 'withdraw') {
      // Check vault has enough balance
      if (vaultAccount.vault_balance < amount) {
        return Response.json({ error: 'Insufficient vault balance' }, { status: 400 });
      }

      // Move points: vault → spendable
      await base44.asServiceRole.entities.Player.update(player_id, {
        points_balance: player.points_balance + amount
      });

      await base44.asServiceRole.entities.VaultAccount.update(vaultAccount.id, {
        vault_balance: vaultAccount.vault_balance - amount,
        total_withdrawn: (vaultAccount.total_withdrawn || 0) + amount,
        last_withdraw_at: new Date().toISOString()
      });

      // Log transaction
      await base44.asServiceRole.entities.Ledger.create({
        player_id,
        change: amount,
        reason: 'admin_adjustment',
        balance_after: player.points_balance + amount,
        note: 'Vault withdrawal'
      });

      await base44.asServiceRole.entities.VaultAuditLog.create({
        player_id,
        action_type: 'vault_withdraw',
        amount,
        note: `Withdrew ${amount} points from vault`
      });

      return Response.json({ 
        success: true,
        vault_balance: vaultAccount.vault_balance - amount,
        points_balance: player.points_balance + amount
      });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Vault transaction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});