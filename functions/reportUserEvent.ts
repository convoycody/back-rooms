import { requireServiceAuth } from './_shared/auth.ts';
import { resolveAppIdentity, sendDevOpsEvent } from './_shared/devopsClient.ts';

Deno.serve(async (req) => {
  try {
    const auth = requireServiceAuth(req);
    if (!auth.ok) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      app_name,
      app_id,
      event_type,
      user_email,
      metadata,
    } = await req.json();

    // Log the event (in production, this would send to Dev Center Ops)
    console.log('User Event Reported:', {
      app_name,
      app_id,
      event_type,
      user_email,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Forward to DevOps hub
    const { appId, appName } = resolveAppIdentity(app_id, app_name);
    const devOpsPayload = {
      app_id: appId,
      app_name: appName,
      event_type,
      user_email,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    await sendDevOpsEvent('/api/functions/webhooks/userEvent', devOpsPayload);

    return Response.json({ 
      success: true,
      message: 'Event reported successfully',
      event: { app_name, event_type, user_email }
    });
  } catch (error) {
    console.error('Error reporting user event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
