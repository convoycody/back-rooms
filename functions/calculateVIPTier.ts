import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// VIP Tier thresholds
const VIP_TIERS = [
  { tier: 0, name: 'Player', min_vip_points: 0 },
  { tier: 1, name: 'Regular', min_vip_points: 100 },
  { tier: 2, name: 'Insider', min_vip_points: 500 },
  { tier: 3, name: 'High Roller', min_vip_points: 2000 },
  { tier: 4, name: 'Elite', min_vip_points: 10000 },
  { tier: 5, name: 'Legend', min_vip_points: 50000 }
];

// Calculate VIP points from player metrics
function calculateVIPPoints(player) {
  let vipPoints = 0;
  
  // XP contribution (1 VIP point per 50 XP)
  vipPoints += Math.floor((player.xp || 0) / 50);
  
  // Active days contribution (10 VIP points per day)
  vipPoints += (player.active_days || 0) * 10;
  
  // Games played contribution (1 VIP point per 5 games)
  vipPoints += Math.floor((player.games_played || 0) / 5);
  
  // Wagered contribution (1 VIP point per 1000 wagered)
  vipPoints += Math.floor((player.total_wagered || 0) / 1000);
  
  // Streak bonus (5 VIP points per day in current streak)
  vipPoints += (player.current_streak || 0) * 5;
  
  // Referral bonus (50 VIP points per completed referral)
  // This would need to be passed in separately, for now we'll skip it
  
  return vipPoints;
}

function getTierFromPoints(vipPoints) {
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (vipPoints >= VIP_TIERS[i].min_vip_points) {
      return VIP_TIERS[i];
    }
  }
  return VIP_TIERS[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id } = await req.json();

    if (!player_id) {
      return Response.json({ error: 'Player ID required' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = players[0];
    const oldTier = player.vip_tier || 0;
    
    // Calculate VIP points
    const vipPoints = calculateVIPPoints(player);
    const newTierInfo = getTierFromPoints(vipPoints);
    const newTier = newTierInfo.tier;
    
    // Calculate next tier info
    const nextTierInfo = VIP_TIERS.find(t => t.tier === newTier + 1);
    const progressToNext = nextTierInfo 
      ? ((vipPoints - newTierInfo.min_vip_points) / (nextTierInfo.min_vip_points - newTierInfo.min_vip_points)) * 100
      : 100;

    // Update player if tier changed
    let tierUpBonus = 0;
    if (newTier > oldTier) {
      // Award bonus for tier increase (5000 points per tier)
      const tiersGained = newTier - oldTier;
      tierUpBonus = tiersGained * 5000;
      
      await base44.asServiceRole.entities.Player.update(player_id, {
        vip_tier: newTier,
        vip_points: vipPoints,
        points_balance: player.points_balance + tierUpBonus
      });
      
      // Create ledger entry
      if (tierUpBonus > 0) {
        await base44.asServiceRole.entities.Ledger.create({
          player_id: player_id,
          change: tierUpBonus,
          reason: 'vip_tier_up',
          balance_after: player.points_balance + tierUpBonus,
          note: `VIP Tier Up: ${VIP_TIERS[oldTier].name} → ${newTierInfo.name}`
        });
      }
    } else if (vipPoints !== player.vip_points) {
      // Just update VIP points if no tier change
      await base44.asServiceRole.entities.Player.update(player_id, {
        vip_points: vipPoints
      });
    }

    return Response.json({
      success: true,
      old_tier: oldTier,
      new_tier: newTier,
      tier_name: newTierInfo.name,
      vip_points: vipPoints,
      tiers_gained: newTier - oldTier,
      bonus_awarded: tierUpBonus,
      progress_to_next: progressToNext,
      next_tier: nextTierInfo ? nextTierInfo.name : 'Max Tier',
      next_tier_requirement: nextTierInfo ? nextTierInfo.min_vip_points : null
    });

  } catch (error) {
    console.error('VIP tier calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});