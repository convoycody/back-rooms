import { createPlatformClient } from './_shared/platformClient.ts';

// Level calculation: 1 level per 10 games played
// No XP system - just simple level based on activity

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { player_id } = await req.json();

    if (!player_id) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = players[0];
    const oldLevel = player.level || 1;
    
    // Calculate new level based on games played (1 level per 10 games)
    const newLevel = Math.floor((player.games_played || 0) / 10) + 1;
    
    let levelUpBonus = 0;
    const levelsGained = newLevel - oldLevel;
    
    // Award bonus for each level gained (1000 points per level)
    if (levelsGained > 0) {
      levelUpBonus = levelsGained * 1000;
    }

    // Update player
    const updates = {
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
      level_up: levelsGained > 0,
      old_level: oldLevel,
      new_level: newLevel,
      levels_gained: levelsGained,
      bonus_awarded: levelUpBonus
    });

  } catch (error) {
    console.error('Level calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});