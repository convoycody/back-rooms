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
      error_message,
      error_stack,
      severity,
      user_affected,
      metadata,
    } = await req.json();

    // Log the error
    console.error('App Error Reported:', {
      app_name,
      app_id,
      error_message,
      error_stack,
      severity,
      user_affected,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Forward to DevOps hub
    const { appId, appName } = resolveAppIdentity(app_id, app_name);
    const devOpsPayload = {
      app_id: appId,
      app_name: appName,
      error_message,
      error_stack,
      severity: severity || 'unknown',
      user_affected,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    await sendDevOpsEvent('/api/functions/webhooks/appError', devOpsPayload);

    return Response.json({ 
      success: true,
      message: 'Error reported successfully',
      error: { app_name, severity, user_affected }
    });
  } catch (error) {
    console.error('Error reporting app error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
