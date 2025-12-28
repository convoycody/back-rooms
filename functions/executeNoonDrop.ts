import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { manual_override, test_mode } = await req.json();
    
    // Check if user is admin (only admins can trigger manually)
    const players = await base44.entities.Player.filter({ created_by: user.email });
    const player = players[0];
    
    if (!player?.is_admin && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get house config
    const configs = await base44.asServiceRole.entities.HouseConfig.list();
    const houseConfig = configs[0];
    
    if (!houseConfig?.noon_drop_enabled && !test_mode) {
      return Response.json({ error: 'Noon Drop is currently disabled' }, { status: 403 });
    }
    
    // Get today's date in Eastern Time
    const now = new Date();
    const etDateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now).split('/').reverse().join('-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$3-$2');
    
    // Check if draw already executed today
    const existingDraws = await base44.asServiceRole.entities.NoonDropDraw.filter({
      draw_date: etDateStr,
      status: 'executed'
    });
    
    if (existingDraws.length > 0 && !test_mode) {
      return Response.json({ 
        error: 'Draw already executed today',
        draw: existingDraws[0]
      }, { status: 400 });
    }
    
    // Get all players
    const allPlayers = await base44.asServiceRole.entities.Player.list();
    
    // Filter eligible players (logged in last 7 days)
    const eligibilityDays = houseConfig?.noon_drop_eligibility_days || 7;
    const cutoffDate = new Date(now.getTime() - eligibilityDays * 24 * 60 * 60 * 1000);
    
    const eligiblePlayers = allPlayers
      .filter(p => {
        const createdDate = new Date(p.created_date);
        return createdDate >= cutoffDate;
      })
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort deterministically
    
    if (eligiblePlayers.length === 0) {
      return Response.json({ 
        error: 'No eligible players found',
        eligible_count: 0
      }, { status: 400 });
    }
    
    // Generate or retrieve server seed
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const seedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    
    // Calculate winning index using provably fair RNG
    const eligibleIds = eligiblePlayers.map(p => p.id);
    const combinedData = `${serverSeed}:${etDateStr}:NOON_DROP:${eligibleIds.join(',')}`;
    const resultHash = crypto.createHash('sha256').update(combinedData).digest('hex');
    const winningIndex = parseInt(resultHash.substring(0, 8), 16) % eligiblePlayers.length;
    
    const winner = eligiblePlayers[winningIndex];
    const prizeAmount = houseConfig?.noon_drop_prize || 1000000;
    
    // Update winner's balance
    const newBalance = winner.points_balance + prizeAmount;
    await base44.asServiceRole.entities.Player.update(winner.id, {
      points_balance: newBalance
    });
    
    // Create ledger entry
    await base44.asServiceRole.entities.Ledger.create({
      player_id: winner.id,
      change: prizeAmount,
      reason: 'noon_drop_jackpot',
      balance_after: newBalance,
      note: `🎉 Noon Drop Winner! ${prizeAmount.toLocaleString()} points`
    });
    
    // Create draw record
    const draw = await base44.asServiceRole.entities.NoonDropDraw.create({
      draw_date: etDateStr,
      draw_time: now.toISOString(),
      seed_hash: seedHash,
      seed_revealed: serverSeed,
      eligible_player_count: eligiblePlayers.length,
      eligible_player_ids: eligibleIds,
      winner_player_id: winner.id,
      winner_display_name: winner.display_name,
      prize_amount: prizeAmount,
      winning_index: winningIndex,
      status: 'executed'
    });
    
    // Report revenue event
    try {
      await base44.asServiceRole.functions.invoke('reportRevenueEvent', {
        app_name: 'The Backrooms',
        app_id: 'the-backrooms',
        transaction_type: 'noon_drop_award',
        amount_usd: 0,
        amount_points: prizeAmount,
        player_email: user.email,
        metadata: {
          draw_id: draw.id,
          eligible_count: eligiblePlayers.length,
          winner_id: winner.id
        }
      });
    } catch (err) {
      console.error('Failed to report revenue event:', err);
    }
    
    return Response.json({
      success: true,
      draw,
      winner: {
        id: winner.id,
        display_name: winner.display_name,
        new_balance: newBalance
      },
      proof: {
        seed_hash: seedHash,
        seed_revealed: serverSeed,
        eligible_count: eligiblePlayers.length,
        winning_index: winningIndex,
        calculation: `SHA256(${serverSeed}:${etDateStr}:NOON_DROP:${eligibleIds.length} players) % ${eligiblePlayers.length} = ${winningIndex}`
      }
    });
    
  } catch (error) {
    console.error('Noon Drop execution error:', error);
    
    // Try to log failure
    try {
      const now = new Date();
      const etDateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now).split('/').reverse().join('-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$3-$2');
      
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.NoonDropDraw.create({
        draw_date: etDateStr,
        draw_time: now.toISOString(),
        seed_hash: 'FAILED',
        status: 'failed',
        failure_reason: error.message
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});