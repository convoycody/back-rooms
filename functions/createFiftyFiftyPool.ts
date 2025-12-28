import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This should be called by admin or scheduled job
    const { pool_date } = await req.json();

    if (!pool_date) {
      return Response.json({ error: 'Pool date required (YYYY-MM-DD)' }, { status: 400 });
    }

    // Check if pool already exists for this date
    const existing = await base44.asServiceRole.entities.FiftyFiftyPool.filter({ pool_date });
    if (existing.length > 0) {
      return Response.json({ 
        message: 'Pool already exists for this date',
        pool: existing[0]
      });
    }

    // Get config
    const configs = await base44.asServiceRole.entities.FiftyFiftyConfig.list();
    const config = configs[0] || { 
      cutoff_hour_et: 20, 
      draw_hour_et: 21 
    };

    // Calculate cutoff and draw times in ET
    const poolDateObj = new Date(pool_date + 'T00:00:00-05:00'); // ET timezone
    const cutoffTime = new Date(poolDateObj);
    cutoffTime.setHours(config.cutoff_hour_et, 0, 0, 0);
    
    const drawTime = new Date(poolDateObj);
    drawTime.setHours(config.draw_hour_et, 0, 0, 0);

    // Generate seed hash (pre-commitment)
    const serverSeed = Math.random().toString(36) + Date.now();
    const seedHash = createHash('sha256').update(serverSeed).digest('hex');

    // Create pool
    const pool = await base44.asServiceRole.entities.FiftyFiftyPool.create({
      pool_date,
      cutoff_at: cutoffTime.toISOString(),
      draw_at: drawTime.toISOString(),
      seed_hash: seedHash,
      status: 'open',
      total_tickets: 0,
      total_pot: 0
    });

    return Response.json({
      success: true,
      pool: pool,
      message: `Pool created for ${pool_date}`
    });

  } catch (error) {
    console.error('Pool creation error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create pool' 
    }, { status: 500 });
  }
});