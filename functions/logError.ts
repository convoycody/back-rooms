import { requireServiceAuth } from './_shared/auth.ts';
import { resolveAppIdentity, sendDevOpsEvent } from './_shared/devopsClient.ts';

Deno.serve(async (req) => {
  try {
    const auth = requireServiceAuth(req, { allowAnonymous: true });
    if (!auth.ok) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Forward to DevOps hub
    const { appId, appName } = resolveAppIdentity();
    const devOpsPayload = {
      app_id: appId,
      app_name: appName,
      error_type,
      error_message,
      error_stack,
      page_url: page_url || 'unknown',
      game_slug: game_slug || null,
      additional_data: additional_data || {},
      player_id: null,
      user_email: 'anonymous',
      timestamp: new Date().toISOString(),
    };

    await sendDevOpsEvent('/api/functions/webhooks/appError', devOpsPayload);

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
