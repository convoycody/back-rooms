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
      amount, 
      currency, 
      category, 
      customer_email, 
      stream_name, 
      metadata 
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