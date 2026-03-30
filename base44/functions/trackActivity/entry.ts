import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
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
    
    // Get today's date in Eastern Time
    const today = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Indiana/Indianapolis',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split(',')[0].split('/');
    const todayKey = `${today[2]}-${today[0].padStart(2, '0')}-${today[1].padStart(2, '0')}`;
    
    const lastActiveDate = player.last_active_date;
    
    // Check if this is a new day
    if (lastActiveDate !== todayKey) {
      const updates = {
        last_active_date: todayKey,
        active_days: (player.active_days || 0) + 1
      };
      
      // Check streak
      if (lastActiveDate) {
        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(todayKey);
        const diffTime = currentDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day - continue streak
          updates.current_streak = (player.current_streak || 0) + 1;
          updates.longest_streak = Math.max(
            updates.current_streak,
            player.longest_streak || 0
          );
        } else {
          // Streak broken
          updates.current_streak = 1;
        }
      } else {
        // First activity
        updates.current_streak = 1;
        updates.longest_streak = 1;
      }
      
      await base44.asServiceRole.entities.Player.update(player_id, updates);
      
      // Process progression for daily activity
      try {
        await base44.functions.invoke('processPlayerProgression', {
          player_id,
          event_type: 'activity_tracked',
          event_data: { 
            active_days: updates.active_days, 
            current_streak: updates.current_streak 
          }
        });
      } catch (err) {
        console.error('Progression processing failed:', err);
      }
      
      return Response.json({
        success: true,
        new_day: true,
        active_days: updates.active_days,
        current_streak: updates.current_streak
      });
    }

    return Response.json({
      success: true,
      new_day: false,
      active_days: player.active_days,
      current_streak: player.current_streak
    });

  } catch (error) {
    console.error('Activity tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});