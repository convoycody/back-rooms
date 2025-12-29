import { createPlatformClient } from './_shared/platformClient.ts';

/**
 * Unified Player Progression Engine
 * 
 * This is the single source of truth for:
 * - XP accumulation from all sources
 * - VIP tier calculation and rewards
 * - Level progression
 * - Activity tracking rewards
 * 
 * All games and systems emit events here instead of calculating rewards themselves.
 */

// VIP Tier thresholds (based on vip_points)
const VIP_TIERS = [
  { tier: 0, name: 'Player', threshold: 0, bonus: 0 },
  { tier: 1, name: 'Regular', threshold: 5000, bonus: 5000 },
  { tier: 2, name: 'Insider', threshold: 15000, bonus: 10000 },
  { tier: 3, name: 'High Roller', threshold: 40000, bonus: 20000 },
  { tier: 4, name: 'Elite', threshold: 100000, bonus: 50000 },
  { tier: 5, name: 'Legend', threshold: 250000, bonus: 100000 }
];

// Level progression (1 level per 10 games)
const LEVEL_BONUS = 1000; // Points per level up

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id, event_type, event_data } = await req.json();

    if (!player_id || !event_type) {
      return Response.json({ error: 'player_id and event_type required' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = players[0];
    const updates = {};
    const rewards = {
      xp_gained: 0,
      vip_points_gained: 0,
      tier_up: false,
      level_up: false,
      points_awarded: 0,
      new_tier: player.vip_tier || 0,
      new_level: player.level || 1,
      tier_name: VIP_TIERS[player.vip_tier || 0].name
    };

    // Process different event types
    switch (event_type) {
      case 'game_completed': {
        // Game completion: calculate XP from wagering and winning
        const { bet, payout } = event_data;
        const net = payout - bet;
        
        // XP = 10% of bet + 5% of net win (if positive)
        const baseXP = Math.floor(bet / 10);
        const winBonus = net > 0 ? Math.floor(net / 20) : 0;
        const totalXP = baseXP + winBonus;
        
        rewards.xp_gained = totalXP;
        
        // Update games played for level calculation
        const newGamesPlayed = (player.games_played || 0) + 1;
        updates.games_played = newGamesPlayed;
        
        // Check for level up (1 level per 10 games)
        const oldLevel = player.level || 1;
        const newLevel = Math.floor(newGamesPlayed / 10) + 1;
        if (newLevel > oldLevel) {
          const levelsGained = newLevel - oldLevel;
          const levelBonus = levelsGained * LEVEL_BONUS;
          rewards.level_up = true;
          rewards.new_level = newLevel;
          rewards.points_awarded += levelBonus;
          updates.level = newLevel;
          
          // Create ledger entry for level up
          await base44.asServiceRole.entities.Ledger.create({
            player_id: player_id,
            change: levelBonus,
            reason: 'level_up_bonus',
            balance_after: player.points_balance + levelBonus,
            note: `Level up! ${oldLevel} → ${newLevel}`
          });
        }
        break;
      }
      
      case 'activity_tracked': {
        // Daily activity tracking (called from trackActivity function)
        // This is already handled by trackActivity, but we can add VIP point rewards here
        const { active_days, current_streak } = event_data;
        
        // Award VIP points for daily activity
        // 10 pts per active day + 5 pts per streak day
        const activityXP = 10 + (current_streak || 0) * 5;
        rewards.xp_gained = activityXP;
        break;
      }
      
      case 'referral_signup': {
        // When a player signs up via referral
        // Award bonus to referrer immediately (handled in signup flow)
        // No XP for this event
        break;
      }
      
      case 'referral_completed': {
        // When referee completes required games
        // Bonus already awarded by checkReferralBonus
        // Award XP to both parties
        rewards.xp_gained = 500; // Bonus XP for completing referral
        break;
      }
      
      case 'daily_bonus_claimed': {
        // Daily bonus claim
        // Award XP for daily engagement
        rewards.xp_gained = 50;
        break;
      }
      
      case 'vault_deposit': {
        // Vault deposit
        // Small XP for financial engagement
        const { amount } = event_data;
        rewards.xp_gained = Math.floor(amount / 1000); // 1 XP per 1000 pts deposited
        break;
      }
      
      default:
        return Response.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Add XP to player
    if (rewards.xp_gained > 0) {
      const newXP = (player.xp || 0) + rewards.xp_gained;
      const newVIPPoints = (player.vip_points || 0) + rewards.xp_gained;
      
      updates.xp = newXP;
      updates.vip_points = newVIPPoints;
      rewards.vip_points_gained = rewards.xp_gained;
      
      // Check for VIP tier up
      const oldTier = player.vip_tier || 0;
      let newTier = 0;
      
      for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
        if (newVIPPoints >= VIP_TIERS[i].threshold) {
          newTier = VIP_TIERS[i].tier;
          break;
        }
      }
      
      if (newTier > oldTier) {
        // Tier up! Award bonuses for each tier gained
        let tierBonus = 0;
        for (let i = oldTier + 1; i <= newTier; i++) {
          tierBonus += VIP_TIERS[i].bonus;
        }
        
        rewards.tier_up = true;
        rewards.new_tier = newTier;
        rewards.tier_name = VIP_TIERS[newTier].name;
        rewards.points_awarded += tierBonus;
        updates.vip_tier = newTier;
        
        // Create ledger entry for tier up
        await base44.asServiceRole.entities.Ledger.create({
          player_id: player_id,
          change: tierBonus,
          reason: 'vip_tier_up',
          balance_after: player.points_balance + tierBonus,
          note: `VIP Tier Up! ${VIP_TIERS[oldTier].name} → ${VIP_TIERS[newTier].name}`
        });
      }
    }

    // Update points balance if any rewards were awarded
    if (rewards.points_awarded > 0) {
      updates.points_balance = player.points_balance + rewards.points_awarded;
    }

    // Apply all updates
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Player.update(player_id, updates);
    }

    return Response.json({
      success: true,
      rewards,
      updates
    });

  } catch (error) {
    console.error('Player progression error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});