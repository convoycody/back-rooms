import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    
    // Get config
    const configs = await base44.asServiceRole.entities.VaultConfig.list();
    const config = configs[0];
    
    if (!config || !config.interest_rate_percentage || config.interest_rate_percentage === 0) {
      return Response.json({ message: 'Interest disabled or not configured' });
    }

    // Get all players with vault balance
    const players = await base44.asServiceRole.entities.Player.list();
    const playersWithVault = players.filter(p => (p.vault_points || 0) > 0);

    if (playersWithVault.length === 0) {
      return Response.json({ message: 'No players with vault balance' });
    }

    const annualRate = config.interest_rate_percentage / 100;
    const frequency = config.interest_compound_frequency || 'daily';
    
    // Calculate rate per period
    let periodsPerYear, ratePerPeriod;
    if (frequency === 'daily') {
      periodsPerYear = 365;
      ratePerPeriod = annualRate / 365;
    } else if (frequency === 'weekly') {
      periodsPerYear = 52;
      ratePerPeriod = annualRate / 52;
    } else {
      periodsPerYear = 12;
      ratePerPeriod = annualRate / 12;
    }

    let totalInterestPaid = 0;
    let playersUpdated = 0;

    for (const player of playersWithVault) {
      const vaultBalance = player.vault_points || 0;
      const interestEarned = Math.floor(vaultBalance * ratePerPeriod);

      if (interestEarned > 0) {
        const newVaultBalance = vaultBalance + interestEarned;

        await base44.asServiceRole.entities.Player.update(player.id, {
          vault_points: newVaultBalance,
        });

        await base44.asServiceRole.entities.VaultTransaction.create({
          player_id: player.id,
          transaction_type: 'interest_earned',
          amount: interestEarned,
          vault_balance_before: vaultBalance,
          vault_balance_after: newVaultBalance,
          spendable_balance_before: player.points_balance || 0,
          spendable_balance_after: player.points_balance || 0,
          note: `${frequency} interest earned (${config.interest_rate_percentage}% APY)`,
        });

        totalInterestPaid += interestEarned;
        playersUpdated++;
      }
    }

    return Response.json({
      success: true,
      frequency,
      annual_rate: config.interest_rate_percentage,
      players_updated: playersUpdated,
      total_interest_paid: totalInterestPaid,
    });
  } catch (error) {
    console.error('Interest calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});