import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

// Payout multipliers for each risk mode (9 buckets)
const PAYOUT_TABLES = {
  low: [1.5, 1.4, 1.3, 1.2, 1.1, 1.2, 1.3, 1.4, 1.5],
  medium: [3, 2, 1.5, 1, 0.5, 1, 1.5, 2, 3],
  high: [10, 5, 2, 0.5, 0.2, 0.5, 2, 5, 10]
};

function generatePath(combinedSeed, rows) {
  const path = [];
  let hash = combinedSeed;
  
  for (let i = 0; i < rows; i++) {
    hash = createHash('sha256').update(hash).digest('hex');
    const value = parseInt(hash.substring(0, 8), 16);
    path.push(value % 2 === 0 ? 'L' : 'R');
  }
  
  return path;
}

function calculateBucket(path) {
  let position = 0;
  for (const direction of path) {
    if (direction === 'R') position++;
  }
  // Normalize to 0-8 bucket range
  const bucketCount = 9;
  const maxPosition = path.length;
  const bucketIndex = Math.floor((position / maxPosition) * bucketCount);
  return Math.min(bucketIndex, bucketCount - 1);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bet_amount, risk_mode, rows, client_seed } = await req.json();

    if (!bet_amount || !risk_mode || !rows || !client_seed) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['low', 'medium', 'high'].includes(risk_mode)) {
      return Response.json({ error: 'Invalid risk mode' }, { status: 400 });
    }

    if (![8, 12, 16].includes(rows)) {
      return Response.json({ error: 'Invalid rows count' }, { status: 400 });
    }

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    // Check balance
    if (player.points_balance < bet_amount) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Check house config
    const configs = await base44.asServiceRole.entities.HouseConfig.list();
    const houseConfig = configs[0];
    
    if (houseConfig && !houseConfig.plinko_enabled) {
      return Response.json({ error: 'Plinko is currently disabled' }, { status: 400 });
    }

    if (houseConfig) {
      if (bet_amount < houseConfig.plinko_min_bet) {
        return Response.json({ error: `Minimum bet is ${houseConfig.plinko_min_bet}` }, { status: 400 });
      }
      if (bet_amount > houseConfig.plinko_max_bet) {
        return Response.json({ error: `Maximum bet is ${houseConfig.plinko_max_bet}` }, { status: 400 });
      }
    }

    // Generate server seed and hash
    const serverSeed = crypto.randomUUID();
    const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

    // Get or initialize nonce
    const nonce = (player.plinko_nonce || 0) + 1;

    // Generate path
    const combinedSeed = createHash('sha256')
      .update(`${serverSeed}:${client_seed}:${nonce}`)
      .digest('hex');
    
    const path = generatePath(combinedSeed, rows);
    const bucketIndex = calculateBucket(path);

    // Get multiplier from payout table
    const payoutTable = PAYOUT_TABLES[risk_mode];
    const multiplier = payoutTable[bucketIndex];
    const payout = Math.floor(bet_amount * multiplier);
    const netResult = payout - bet_amount;

    // Update player balance and stats
    const newBalance = player.points_balance + netResult;
    const xpGain = Math.floor(bet_amount / 10) + (netResult > 0 ? 10 : 0);
    const newXp = player.xp + xpGain;
    const newLevel = Math.floor(newXp / 500) + 1;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newBalance,
      xp: newXp,
      level: newLevel,
      total_wagered: player.total_wagered + bet_amount,
      total_won: player.total_won + (netResult > 0 ? payout : 0),
      games_played: player.games_played + 1,
      biggest_win: Math.max(player.biggest_win || 0, payout),
      plinko_nonce: nonce,
      plinko_drops: (player.plinko_drops || 0) + 1
    });

    // Create session record
    const session = await base44.asServiceRole.entities.PlinkoSession.create({
      player_id: player.id,
      bet_amount,
      risk_mode,
      rows,
      bucket_index: bucketIndex,
      multiplier,
      payout,
      net_result: netResult,
      path,
      client_seed,
      server_seed_hash: serverSeedHash,
      nonce
    });

    // Create ledger entries
    await base44.asServiceRole.entities.Ledger.create({
      player_id: player.id,
      change: -bet_amount,
      reason: 'game_bet',
      session_id: session.id,
      balance_after: player.points_balance - bet_amount,
      note: `Plinko bet (${risk_mode} risk)`
    });

    if (payout > 0) {
      await base44.asServiceRole.entities.Ledger.create({
        player_id: player.id,
        change: payout,
        reason: 'game_win',
        session_id: session.id,
        balance_after: newBalance,
        note: `Plinko win: ${multiplier}x (bucket ${bucketIndex})`
      });
    }

    return Response.json({
      success: true,
      bet_amount,
      risk_mode,
      rows,
      path,
      bucket_index,
      multiplier,
      payout,
      net_result: netResult,
      new_balance: newBalance,
      xp_gained: xpGain,
      server_seed_hash: serverSeedHash,
      nonce
    });

  } catch (error) {
    console.error('Plinko drop error:', error);
    return Response.json({ 
      error: error.message || 'Drop failed',
      details: error.stack 
    }, { status: 500 });
  }
});