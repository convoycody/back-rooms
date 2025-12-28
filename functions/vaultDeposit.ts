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

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Check spendable balance
    if (player.points_balance < amount) {
      return Response.json({ error: 'Insufficient spendable balance' }, { status: 400 });
    }

    // Atomic update
    const newSpendable = player.points_balance - amount;
    const newVault = (player.vault_points || 0) + amount;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newSpendable,
      vault_points: newVault
    });

    // Log transaction
    await base44.asServiceRole.entities.VaultTransaction.create({
      player_id: player.id,
      transaction_type: 'deposit',
      amount: amount,
      vault_balance_before: player.vault_points || 0,
      vault_balance_after: newVault,
      spendable_balance_before: player.points_balance,
      spendable_balance_after: newSpendable,
      note: 'Vault deposit'
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