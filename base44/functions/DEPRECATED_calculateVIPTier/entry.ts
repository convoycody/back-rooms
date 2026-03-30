import { createPlatformClient } from './_shared/platformClient.ts';

/**
 * DEPRECATED: Use processPlayerProgression instead
 * 
 * This function has been replaced by the unified progression engine.
 * Keeping for backwards compatibility only.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const { player_id, xp_to_add } = await req.json();

    // Redirect to new unified engine
    const response = await base44.functions.invoke('processPlayerProgression', {
      player_id,
      event_type: 'game_completed',
      event_data: { bet: xp_to_add * 10, payout: xp_to_add * 10 } // Approximate
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Deprecated VIP tier function:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});