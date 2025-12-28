import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

const PRIZE_TIERS = {
  frequent: [
    { symbols: ['🍒', '🍒', '🍒'], prize: 100 },
    { symbols: ['🍋', '🍋', '🍋'], prize: 250 },
    { symbols: ['🍇', '🍇', '🍇'], prize: 5000 },
    { symbols: ['💎', '💎', '💎'], prize: 10000 },
    { symbols: ['7️⃣', '7️⃣', '7️⃣'], prize: 100000 },
    { symbols: ['⭐', '⭐', '⭐'], prize: 250000 }
  ],
  rare_monthly: { symbols: ['👑', '👑', '👑'], prize: 500000 },
  rare_semiannual: { symbols: ['💰', '💰', '💰'], prize: 1000000 },
  rare_annual: { symbols: ['🏆', '🏆', '🏆'], prize: 2000000 }
};

function generateCardResult(clientSeed, serverSeed, nonce, availablePools) {
  // Create deterministic result from seeds
  const combined = `${clientSeed}-${serverSeed}-${nonce}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  const value = parseInt(hash.substring(0, 8), 16) / 0xffffffff;

  // Check rare prizes first
  if (availablePools.annual && value < 0.0001) { // 0.01% chance
    return { tier: 'rare_annual', ...PRIZE_TIERS.rare_annual, isRare: true };
  }
  if (availablePools.semiannual && value < 0.0005) { // 0.05% chance
    return { tier: 'rare_semiannual', ...PRIZE_TIERS.rare_semiannual, isRare: true };
  }
  if (availablePools.monthly && value < 0.002) { // 0.2% chance
    return { tier: 'rare_monthly', ...PRIZE_TIERS.rare_monthly, isRare: true };
  }

  // Frequent prizes (30% win rate overall)
  if (value < 0.3) {
    const prizeIndex = Math.floor((value / 0.3) * PRIZE_TIERS.frequent.length);
    const prize = PRIZE_TIERS.frequent[Math.min(prizeIndex, PRIZE_TIERS.frequent.length - 1)];
    return { tier: 'frequent', ...prize, isRare: false };
  }

  // Losing card
  return { 
    tier: 'frequent', 
    symbols: ['🎫', '🎫', '🎫'], 
    prize: 0, 
    isRare: false 
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_seed } = await req.json();
    const cost = 1000;

    // Get player
    const players = await base44.asServiceRole.entities.Player.filter({ created_by: user.email });
    if (players.length === 0) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    const player = players[0];

    if (player.points_balance < cost) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Check available rare prize pools
    const now = new Date();
    const pools = await base44.asServiceRole.entities.ScratchCardPool.filter({ is_awarded: false });
    
    const availablePools = {
      monthly: pools.find(p => p.pool_type === 'monthly_500k' && new Date(p.period_end) > now),
      semiannual: pools.find(p => p.pool_type === 'semiannual_1m' && new Date(p.period_end) > now),
      annual: pools.find(p => p.pool_type === 'annual_2m' && new Date(p.period_end) > now)
    };

    // Generate server seed and result
    const serverSeed = Math.random().toString(36).substring(2, 15);
    const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');
    const nonce = (player.scratch_nonce || 0) + 1;

    const result = generateCardResult(client_seed, serverSeed, nonce, availablePools);

    // Create scratch card
    const card = await base44.asServiceRole.entities.ScratchCard.create({
      player_id: player.id,
      cost,
      prize: result.prize,
      prize_tier: result.tier,
      symbols: result.symbols,
      is_winner: result.prize > 0,
      scratched_at: new Date().toISOString(),
      client_seed,
      server_seed_hash: serverSeedHash,
      nonce
    });

    // Update player balance
    const netResult = result.prize - cost;
    const newBalance = player.points_balance + netResult;

    await base44.asServiceRole.entities.Player.update(player.id, {
      points_balance: newBalance,
      scratch_nonce: nonce
    });

    // Create ledger entry
    await base44.asServiceRole.entities.Ledger.create({
      player_id: player.id,
      change: netResult,
      reason: result.prize > 0 ? 'game_win' : 'game_bet',
      balance_after: newBalance,
      note: `Scratch card: ${result.prize > 0 ? 'Won ' + result.prize : 'Lost ' + cost}`
    });

    // If rare prize, mark pool as awarded and create announcement
    if (result.isRare) {
      let poolId = null;
      if (result.tier === 'rare_monthly') poolId = availablePools.monthly?.id;
      else if (result.tier === 'rare_semiannual') poolId = availablePools.semiannual?.id;
      else if (result.tier === 'rare_annual') poolId = availablePools.annual?.id;

      if (poolId) {
        await base44.asServiceRole.entities.ScratchCardPool.update(poolId, {
          is_awarded: true,
          awarded_to_player_id: player.id,
          awarded_at: new Date().toISOString(),
          scratch_card_id: card.id
        });
      }

      // Create announcement
      await base44.functions.invoke('createAnnouncement', {
        player_id: player.id,
        type: 'rare_prize',
        game_id: 'scratchers',
        game_name: 'Scratchers',
        amount: result.prize,
        multiplier: result.prize / cost
      });
    } else if (result.prize >= 250000) {
      // Create announcement for big wins
      await base44.functions.invoke('createAnnouncement', {
        player_id: player.id,
        type: 'big_win',
        game_id: 'scratchers',
        game_name: 'Scratchers',
        amount: result.prize,
        multiplier: result.prize / cost
      });
    }

    return Response.json({
      success: true,
      card,
      result: {
        symbols: result.symbols,
        prize: result.prize,
        is_winner: result.prize > 0,
        is_rare: result.isRare,
        new_balance: newBalance
      }
    });

  } catch (error) {
    console.error('Scratch card error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});