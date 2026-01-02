import { createPlatformClient } from './_shared/platformClient.ts';
import * as crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createPlatformClient(req);
    
    // Get house config
    const configs = await base44.asServiceRole.entities.HouseConfig.list();
    const houseConfig = configs[0];
    
    if (!houseConfig?.noon_drop_enabled) {
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
    
    if (existingDraws.length > 0) {
      return Response.json({ 
        error: 'Draw already executed today',
        draw: existingDraws[0]
      }, { status: 400 });
    }
    
    // Get all players
    const allPlayers = await base44.asServiceRole.entities.Player.list();
    
    // Filter eligible players (active in last 7 days)
    const eligibilityDays = houseConfig?.noon_drop_eligibility_days || 7;
    const cutoffDate = new Date(now.getTime() - eligibilityDays * 24 * 60 * 60 * 1000);
    
    const eligiblePlayers = allPlayers
      .filter(p => {
        const lastActive = new Date(p.updated_date);
        return lastActive >= cutoffDate;
      })
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort deterministically
    
    if (eligiblePlayers.length === 0) {
      return Response.json({ 
        error: 'No eligible players found',
        eligible_count: 0
      }, { status: 400 });
    }
    
    // Generate provably fair seed
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
      note: `🎉 Noon Drop Winner! ${prizeAmount.toLocaleString()} points`,
      is_shareable: true
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
    
    // Create announcement
    try {
      await base44.asServiceRole.functions.invoke('createAnnouncement', {
        player_id: winner.id,
        type: 'jackpot',
        game_id: 'noon-drop',
        game_name: 'Noon Drop',
        amount: prizeAmount,
        multiplier: 0
      });
    } catch (err) {
      console.error('Failed to create announcement:', err);
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
        winning_index: winningIndex
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
      
      const base44 = createPlatformClient(req);
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