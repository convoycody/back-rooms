import { createPlatformClient } from './_shared/platformClient.ts';

/**
 * DEPRECATED: Use processPlayerProgression instead
 * 
 * This function has been replaced by the unified progression engine.
 * Level ups now happen automatically through game_completed events.
 * Keeping for backwards compatibility only.
 */

Deno.serve(async (req) => {
  try {
    return Response.json({
      success: true,
      message: 'This function is deprecated. Level ups are handled by processPlayerProgression automatically.',
      level_up: false
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});