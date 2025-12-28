import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0 || (!players[0].is_admin && user.role !== 'admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    
    // Monthly pool (500k) - resets every month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const existingMonthly = await base44.asServiceRole.entities.ScratchCardPool.filter({
      pool_type: 'monthly_500k',
      is_awarded: false
    });
    
    if (existingMonthly.length === 0) {
      await base44.asServiceRole.entities.ScratchCardPool.create({
        pool_type: 'monthly_500k',
        prize_amount: 500000,
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString()
      });
    }

    // Semiannual pool (1M) - resets every 6 months
    const sixMonthsStart = now.getMonth() < 6 
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(now.getFullYear(), 6, 1);
    const sixMonthsEnd = now.getMonth() < 6
      ? new Date(now.getFullYear(), 5, 30, 23, 59, 59)
      : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const existingSemiannual = await base44.asServiceRole.entities.ScratchCardPool.filter({
      pool_type: 'semiannual_1m',
      is_awarded: false
    });
    
    if (existingSemiannual.length === 0) {
      await base44.asServiceRole.entities.ScratchCardPool.create({
        pool_type: 'semiannual_1m',
        prize_amount: 1000000,
        period_start: sixMonthsStart.toISOString(),
        period_end: sixMonthsEnd.toISOString()
      });
    }

    // Annual pool (2M) - resets every year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const existingAnnual = await base44.asServiceRole.entities.ScratchCardPool.filter({
      pool_type: 'annual_2m',
      is_awarded: false
    });
    
    if (existingAnnual.length === 0) {
      await base44.asServiceRole.entities.ScratchCardPool.create({
        pool_type: 'annual_2m',
        prize_amount: 2000000,
        period_start: yearStart.toISOString(),
        period_end: yearEnd.toISOString()
      });
    }

    return Response.json({
      success: true,
      message: 'Scratch card pools initialized'
    });

  } catch (error) {
    console.error('Pool initialization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});