import { createPlatformClient } from './_shared/platformClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = players[0];

    // Check if already has referral code
    if (player.referral_code) {
      return Response.json({ 
        message: 'Referral code already exists',
        referral_code: player.referral_code 
      });
    }

    // Generate new referral code
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Update player
    await base44.entities.Player.update(player.id, {
      referral_code: referralCode
    });

    return Response.json({ 
      success: true,
      referral_code: referralCode,
      message: 'Referral code generated successfully'
    });

  } catch (error) {
    console.error('Error fixing referral code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});