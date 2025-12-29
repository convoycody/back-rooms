import { createPlatformClient } from './_shared/platformClient.ts';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    const { draw_date } = await req.json();

    if (!draw_date) {
      return Response.json({ error: 'Draw date required' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.NumbersLotteryDraw.filter({ draw_date });
    if (existing.length > 0) {
      return Response.json({ message: 'Draw exists', draw: existing[0] });
    }

    const configs = await base44.asServiceRole.entities.NumbersLotteryConfig.list();
    const config = configs[0] || { cutoff_hour_et: 22, draw_hour_et: 23 };

    const dateObj = new Date(draw_date + 'T00:00:00-05:00');
    const cutoffTime = new Date(dateObj);
    cutoffTime.setHours(config.cutoff_hour_et, 0, 0, 0);
    
    const drawTime = new Date(dateObj);
    drawTime.setHours(config.draw_hour_et, 0, 0, 0);

    const seed = Math.random().toString(36) + Date.now();
    const seedHash = createHash('sha256').update(seed).digest('hex');

    const draw = await base44.asServiceRole.entities.NumbersLotteryDraw.create({
      draw_date,
      cutoff_at: cutoffTime.toISOString(),
      draw_at: drawTime.toISOString(),
      seed_hash: seedHash,
      status: 'open',
      total_tickets: 0,
      total_pot: 0,
      rollover_from_previous: config.rollover_pot || 0
    });

    return Response.json({ success: true, draw });

  } catch (error) {
    console.error('Create draw error:', error);
    return Response.json({ error: error.message || 'Failed' }, { status: 500 });
  }
});