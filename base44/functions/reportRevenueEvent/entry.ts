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
      amount,
      currency,
      category,
      customer_email,
      stream_name,
      metadata,
    } = await req.json();

    // Log the revenue event
    console.log('Revenue Event Reported:', {
      app_name,
      app_id,
      amount,
      currency,
      category,
      customer_email,
      stream_name,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Forward to DevOps hub
    const { appId, appName } = resolveAppIdentity(app_id, app_name);
    const devOpsPayload = {
      app_id: appId,
      app_name: appName,
      amount,
      currency,
      category,
      customer_email,
      stream_name,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    await sendDevOpsEvent('/api/functions/webhooks/revenueEvent', devOpsPayload);

    return Response.json({ 
      success: true,
      message: 'Revenue event reported successfully',
      event: { app_name, amount, currency, category }
    });
  } catch (error) {
    console.error('Error reporting revenue event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
