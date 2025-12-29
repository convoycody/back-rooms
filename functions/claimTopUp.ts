import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
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

    if (!config?.topup_enabled) {
      return Response.json({ error: 'Top-up is disabled' }, { status: 400 });
    }

    // Check balance threshold
    if (player.points_balance >= config.topup_threshold) {
      return Response.json({ 
        error: 'Balance too high for top-up',
        eligible: false 
      }, { status: 400 });
    }

    // Get current day in Indy timezone
    const indyTime = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Indiana/Indianapolis' 
    });
    const indyDate = new Date(indyTime);
    const dayKey = indyDate.toISOString().split('T')[0];

    // Reset daily counter if new day
    let topupCount = player.topup_count_today || 0;
    if (player.last_topup_date !== dayKey) {
      topupCount = 0;
    }

    // Check daily limit
    if (topupCount >= config.topup_max_per_day) {
      return Response.json({ 
        error: 'Daily top-up limit reached',
        eligible: false 
      }, { status: 400 });
    }

    // Check cooldown
    if (player.last_topup_at) {
      const lastTopup = new Date(player.last_topup_at);
      const now = new Date();
      const minutesSince = (now - lastTopup) / (1000 * 60);
      
      if (minutesSince < config.topup_cooldown_minutes) {
        const waitMinutes = Math.ceil(config.topup_cooldown_minutes - minutesSince);
        return Response.json({ 
          error: 'Cooldown active',
          eligible: false,
          wait_minutes: waitMinutes
        }, { status: 400 });
      }
    }

    // Grant top-up
    const topupAmount = config.topup_amount;
    const newBalance = player.points_balance + topupAmount;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newBalance,
      topup_count_today: topupCount + 1,
      last_topup_date: dayKey,
      last_topup_at: new Date().toISOString()
    });

    await base44.asServiceRole.entities.Ledger.create({
      player_id: player.id,
      change: topupAmount,
      reason: 'auto_topup',
      balance_after: newBalance,
      note: `Top-up ${topupCount + 1}/${config.topup_max_per_day} for ${dayKey}`
    });

    return Response.json({
      success: true,
      amount: topupAmount,
      new_balance: newBalance,
      remaining_today: config.topup_max_per_day - (topupCount + 1)
    });

  } catch (error) {
    console.error('Top-up error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});