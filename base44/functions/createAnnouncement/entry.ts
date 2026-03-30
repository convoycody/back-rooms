import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      player_id, 
      type, 
      game_id, 
      game_name, 
      amount, 
      multiplier, 
      ledger_id 
    } = await req.json();

    // Get player and settings
    const players = await base44.asServiceRole.entities.Player.filter({ id: player_id });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    const settingsResults = await base44.asServiceRole.entities.PlayerSettings.filter({ player_id });
    const settings = settingsResults[0] || { allow_public_announcements: true };

    // Generate share slug
    const shareSlug = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Determine if announcement should be public
    const isPublic = settings.allow_public_announcements;
    const displayName = isPublic ? player.display_name : 'Anonymous Player';

    // Create message
    let message = '';
    if (type === 'big_win') {
      message = isPublic 
        ? `${displayName} won ${amount.toLocaleString()} points on ${game_name}! 🎉`
        : `A player won ${amount.toLocaleString()} points on ${game_name}! 🎉`;
    } else if (type === 'rare_prize') {
      message = isPublic
        ? `${displayName} hit a RARE PRIZE of ${amount.toLocaleString()} points on ${game_name}! 🌟`
        : `A player hit a RARE PRIZE of ${amount.toLocaleString()} points on ${game_name}! 🌟`;
    } else if (type === 'jackpot') {
      message = isPublic
        ? `${displayName} HIT THE JACKPOT! ${amount.toLocaleString()} points! 💰`
        : `A player HIT THE JACKPOT! ${amount.toLocaleString()} points! 💰`;
    }

    // Create announcement
    const announcement = await base44.asServiceRole.entities.Announcement.create({
      type,
      player_id,
      display_name: displayName,
      is_public: isPublic,
      game_id,
      game_name,
      amount,
      multiplier,
      message,
      ledger_id,
      share_slug,
      metadata: {
        referral_code: player.referral_code
      }
    });

    return Response.json({
      success: true,
      announcement,
      share_url: `/announcements/${shareSlug}`
    });

  } catch (error) {
    console.error('Announcement creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});