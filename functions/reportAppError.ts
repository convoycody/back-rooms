import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { 
      app_name, 
      app_id, 
      error_message, 
      error_stack, 
      severity, 
      user_affected, 
      metadata 
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