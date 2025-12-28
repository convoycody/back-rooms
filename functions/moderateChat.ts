import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const moderator = players[0];

    if (!moderator.is_admin && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      action_type, 
      target_player_id, 
      message_id, 
      reason, 
      duration_minutes 
    } = await req.json();

    // Get target player
    const targetPlayers = await base44.asServiceRole.entities.Player.filter({ id: target_player_id });
    if (targetPlayers.length === 0) {
      return Response.json({ error: 'Target player not found' }, { status: 404 });
    }
    const targetPlayer = targetPlayers[0];

    // Perform action
    let expiresAt = null;
    
    if (action_type === 'delete_message' && message_id) {
      await base44.asServiceRole.entities.ChatMessage.update(message_id, {
        is_deleted: true,
        deleted_by: moderator.id,
        deleted_at: new Date().toISOString()
      });
    } else if (action_type === 'timeout') {
      expiresAt = new Date(Date.now() + (duration_minutes || 10) * 60 * 1000).toISOString();
      
      // Get or create settings
      const settingsResults = await base44.asServiceRole.entities.PlayerSettings.filter({ 
        player_id: target_player_id 
      });
      
      if (settingsResults.length > 0) {
        await base44.asServiceRole.entities.PlayerSettings.update(settingsResults[0].id, {
          chat_timeout_until: expiresAt
        });
      } else {
        await base44.asServiceRole.entities.PlayerSettings.create({
          player_id: target_player_id,
          chat_timeout_until: expiresAt
        });
      }
    } else if (action_type === 'ban') {
      const settingsResults = await base44.asServiceRole.entities.PlayerSettings.filter({ 
        player_id: target_player_id 
      });
      
      if (settingsResults.length > 0) {
        await base44.asServiceRole.entities.PlayerSettings.update(settingsResults[0].id, {
          chat_banned: true
        });
      } else {
        await base44.asServiceRole.entities.PlayerSettings.create({
          player_id: target_player_id,
          chat_banned: true
        });
      }
    } else if (action_type === 'unban') {
      const settingsResults = await base44.asServiceRole.entities.PlayerSettings.filter({ 
        player_id: target_player_id 
      });
      
      if (settingsResults.length > 0) {
        await base44.asServiceRole.entities.PlayerSettings.update(settingsResults[0].id, {
          chat_banned: false,
          chat_timeout_until: null
        });
      }
    }

    // Log moderation action
    await base44.asServiceRole.entities.ModerationAction.create({
      action_type,
      moderator_id: moderator.id,
      moderator_name: moderator.display_name,
      target_player_id,
      target_player_name: targetPlayer.display_name,
      message_id,
      reason,
      duration_minutes,
      expires_at: expiresAt
    });

    return Response.json({
      success: true,
      action: action_type,
      target: targetPlayer.display_name,
      expires_at: expiresAt
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});