import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const { 
      error_type, 
      error_message, 
      error_stack, 
      page_url, 
      game_slug, 
      additional_data 
    } = await req.json();

    // Generate unique error ID
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Get player info if user exists
    let playerId = null;
    if (user) {
      const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
      if (players.length > 0) {
        playerId = players[0].id;
      }
    }

    // Log error to database
    await base44.asServiceRole.entities.ErrorLog.create({
      error_id: errorId,
      error_type: error_type || 'other',
      user_email: user?.email || 'anonymous',
      player_id: playerId,
      page_url: page_url || 'unknown',
      game_slug: game_slug || null,
      error_message: error_message || 'Unknown error',
      error_stack: error_stack || '',
      user_agent: req.headers.get('user-agent') || 'unknown',
      additional_data: additional_data || {},
      status: 'new'
    });

    console.error(`[ERROR ${errorId}]`, {
      type: error_type,
      message: error_message,
      user: user?.email,
      game: game_slug,
      stack: error_stack
    });

    return Response.json({
      success: true,
      error_id: errorId
    });

  } catch (error) {
    console.error('Failed to log error:', error);
    return Response.json({ 
      error: 'Failed to log error',
      details: error.message 
    }, { status: 500 });
  }
});