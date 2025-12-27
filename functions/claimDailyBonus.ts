import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Get house config
    const configs = await base44.asServiceRole.entities.HouseConfig.list();
    const config = configs[0];

    if (!config?.daily_bonus_enabled) {
      return Response.json({ error: 'Daily bonus is disabled' }, { status: 400 });
    }

    // Get current day in America/Indiana/Indianapolis timezone
    const indyTime = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Indiana/Indianapolis' 
    });
    const indyDate = new Date(indyTime);
    const dayKey = indyDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if already claimed today
    if (player.daily_last_claim_date === dayKey) {
      // Calculate next eligible time
      const tomorrow = new Date(indyDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return Response.json({
        error: 'Already claimed today',
        already_claimed: true,
        next_eligible: tomorrow.toISOString(),
        day_key: dayKey
      }, { status: 400 });
    }

    // Claim the bonus
    const bonusAmount = config.daily_bonus_amount;
    const newBalance = player.points_balance + bonusAmount;

    // Update player (atomic operation)
    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newBalance,
      daily_last_claim_date: dayKey
    });

    // Create ledger entry
    await base44.asServiceRole.entities.Ledger.create({
      player_id: player.id,
      change: bonusAmount,
      reason: 'daily_bonus',
      balance_after: newBalance,
      note: `Daily bonus claimed for ${dayKey}`
    });

    return Response.json({
      success: true,
      amount: bonusAmount,
      new_balance: newBalance,
      day_key: dayKey
    });

  } catch (error) {
    console.error('Daily bonus claim error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});