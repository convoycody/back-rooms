import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// XP calculation: Each level requires 500 XP
// Level 1: 0-499 XP
// Level 2: 500-999 XP
// Level 3: 1000-1499 XP, etc.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id, xp_to_add } = await req.json();

    if (!player_id || typeof xp_to_add !== 'number') {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = players[0];
    const oldXp = player.xp || 0;
    const oldLevel = player.level || 1;
    const newXp = oldXp + xp_to_add;
    
    // Calculate new level (1 XP = 1 point towards next level, 500 XP per level)
    const newLevel = Math.floor(newXp / 500) + 1;
    
    let levelUpBonus = 0;
    const levelsGained = newLevel - oldLevel;
    
    // Award bonus for each level gained (1000 points per level)
    if (levelsGained > 0) {
      levelUpBonus = levelsGained * 1000;
    }

    // Update player
    const updates = {
      xp: newXp,
      level: newLevel,
    };

    if (levelUpBonus > 0) {
      updates.points_balance = player.points_balance + levelUpBonus;
    }

    await base44.asServiceRole.entities.Player.update(player_id, updates);

    // Create ledger entry for level-up bonus
    if (levelUpBonus > 0) {
      await base44.asServiceRole.entities.Ledger.create({
        player_id: player_id,
        change: levelUpBonus,
        reason: 'level_up_bonus',
        balance_after: updates.points_balance,
        note: `Level up! ${oldLevel} → ${newLevel} (+${levelsGained} level${levelsGained > 1 ? 's' : ''})`
      });
    }

    return Response.json({
      success: true,
      old_level: oldLevel,
      new_level: newLevel,
      old_xp: oldXp,
      new_xp: newXp,
      xp_added: xp_to_add,
      levels_gained: levelsGained,
      bonus_awarded: levelUpBonus
    });

  } catch (error) {
    console.error('Level calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});