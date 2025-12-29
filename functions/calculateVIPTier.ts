import { createPlatformClient } from './_shared/platformClient.ts';

// VIP Tier thresholds based on vip_points (XP)
const VIP_TIERS = [
  { tier: 0, name: 'Player', threshold: 0, bonus: 0 },
  { tier: 1, name: 'Regular', threshold: 5000, bonus: 5000 },
  { tier: 2, name: 'Insider', threshold: 15000, bonus: 10000 },
  { tier: 3, name: 'High Roller', threshold: 40000, bonus: 20000 },
  { tier: 4, name: 'Elite', threshold: 100000, bonus: 50000 },
  { tier: 5, name: 'Legend', threshold: 250000, bonus: 100000 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id, xp_to_add } = await req.json();

    if (!player_id) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = players[0];
    const oldVipPoints = player.vip_points || 0;
    const oldTier = player.vip_tier || 0;
    
    // Add XP if provided
    const newVipPoints = oldVipPoints + (xp_to_add || 0);
    
    // Calculate new tier
    let newTier = 0;
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (newVipPoints >= VIP_TIERS[i].threshold) {
        newTier = VIP_TIERS[i].tier;
        break;
      }
    }
    
    let tierUpBonus = 0;
    const tiersGained = newTier - oldTier;
    
    // Award bonus for each tier gained
    if (tiersGained > 0) {
      for (let i = oldTier + 1; i <= newTier; i++) {
        tierUpBonus += VIP_TIERS[i].bonus;
      }
    }

    // Update player
    const updates = {
      vip_points: newVipPoints,
      vip_tier: newTier,
    };

    if (tierUpBonus > 0) {
      updates.points_balance = player.points_balance + tierUpBonus;
    }

    await base44.asServiceRole.entities.Player.update(player_id, updates);

    // Create ledger entry for tier-up bonus
    if (tierUpBonus > 0) {
      await base44.asServiceRole.entities.Ledger.create({
        player_id: player_id,
        change: tierUpBonus,
        reason: 'vip_tier_up',
        balance_after: updates.points_balance,
        note: `VIP Tier Up! ${VIP_TIERS[oldTier].name} → ${VIP_TIERS[newTier].name}`
      });
    }

    return Response.json({
      success: true,
      tier_up: tiersGained > 0,
      old_tier: oldTier,
      new_tier: newTier,
      old_vip_points: oldVipPoints,
      new_vip_points: newVipPoints,
      xp_added: xp_to_add || 0,
      tiers_gained: tiersGained,
      bonus_awarded: tierUpBonus,
      tier_name: VIP_TIERS[newTier].name,
      next_tier: newTier < 5 ? VIP_TIERS[newTier + 1] : null
    });

  } catch (error) {
    console.error('VIP tier calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});