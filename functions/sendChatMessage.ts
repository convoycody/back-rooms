import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, message_type = 'text', shared_content_id, room_id = 'back-rooms' } = await req.json();

    if (!message || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 500) {
      return Response.json({ error: 'Message too long' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Check settings for ban/timeout
    const settingsResults = await base44.asServiceRole.entities.PlayerSettings.filter({ player_id: player.id });
    const settings = settingsResults[0];

    if (settings?.chat_banned) {
      return Response.json({ error: 'You are banned from chat' }, { status: 403 });
    }

    if (settings?.chat_timeout_until) {
      const timeoutExpires = new Date(settings.chat_timeout_until);
      if (timeoutExpires > new Date()) {
        return Response.json({ 
          error: 'You are timed out from chat',
          timeout_until: settings.chat_timeout_until
        }, { status: 403 });
      }
    }

    // Rate limiting: check last message time
    const recentMessages = await base44.asServiceRole.entities.ChatMessage.filter(
      { player_id: player.id },
      '-created_date',
      5
    );

    if (recentMessages.length > 0) {
      const lastMessage = recentMessages[0];
      const timeSinceLastMessage = Date.now() - new Date(lastMessage.created_date).getTime();
      
      if (timeSinceLastMessage < 2000) { // 2 second cooldown
        return Response.json({ error: 'Please wait before sending another message' }, { status: 429 });
      }
    }

    // Create message
    const chatMessage = await base44.asServiceRole.entities.ChatMessage.create({
      room_id,
      player_id: player.id,
      display_name: player.display_name,
      vip_tier: player.vip_tier || 0,
      avatar_url: player.avatar_url,
      message: message.trim(),
      message_type,
      shared_content_id
    });

    return Response.json({
      success: true,
      message: chatMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});