import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      app_name, 
      app_id, 
      event_type, 
      user_email, 
      metadata 
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

    // Store event in database for tracking
    await base44.asServiceRole.entities.Ledger.create({
      player_id: metadata?.player_id || user_email,
      change: 0,
      reason: 'admin_adjustment',
      balance_after: 0,
      note: `Event: ${event_type} - ${JSON.stringify(metadata)}`
    });

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