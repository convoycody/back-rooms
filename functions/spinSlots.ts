import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as crypto from 'node:crypto';

// Symbol definitions
const SYMBOLS = {
  LEMON: '🍋',
  CHERRY: '🍒',
  GRAPE: '🍇',
  BELL: '🔔',
  BAR: '💎',
  SEVEN: '7️⃣',
  WILD: '⭐',
  SCATTER: '💰'
};

// Reel strips with weighted distribution
const REEL_STRIPS = [
  // Reel 1 (more generous)
  [
    SYMBOLS.LEMON, SYMBOLS.LEMON, SYMBOLS.LEMON, SYMBOLS.LEMON,
    SYMBOLS.CHERRY, SYMBOLS.CHERRY, SYMBOLS.CHERRY,
    SYMBOLS.GRAPE, SYMBOLS.GRAPE, SYMBOLS.GRAPE,
    SYMBOLS.BELL, SYMBOLS.BELL,
    SYMBOLS.BAR, SYMBOLS.BAR,
    SYMBOLS.SEVEN,
    SYMBOLS.WILD, SYMBOLS.WILD,
    SYMBOLS.SCATTER
  ],
  // Reel 2
  [
    SYMBOLS.LEMON, SYMBOLS.LEMON, SYMBOLS.LEMON,
    SYMBOLS.CHERRY, SYMBOLS.CHERRY, SYMBOLS.CHERRY,
    SYMBOLS.GRAPE, SYMBOLS.GRAPE, SYMBOLS.GRAPE,
    SYMBOLS.BELL, SYMBOLS.BELL,
    SYMBOLS.BAR, SYMBOLS.BAR,
    SYMBOLS.SEVEN,
    SYMBOLS.WILD,
    SYMBOLS.SCATTER
  ],
  // Reel 3 (middle)
  [
    SYMBOLS.LEMON, SYMBOLS.LEMON, SYMBOLS.LEMON,
    SYMBOLS.CHERRY, SYMBOLS.CHERRY, SYMBOLS.CHERRY,
    SYMBOLS.GRAPE, SYMBOLS.GRAPE,
    SYMBOLS.BELL, SYMBOLS.BELL,
    SYMBOLS.BAR, SYMBOLS.BAR,
    SYMBOLS.SEVEN,
    SYMBOLS.WILD,
    SYMBOLS.SCATTER
  ],
  // Reel 4
  [
    SYMBOLS.LEMON, SYMBOLS.LEMON,
    SYMBOLS.CHERRY, SYMBOLS.CHERRY, SYMBOLS.CHERRY,
    SYMBOLS.GRAPE, SYMBOLS.GRAPE,
    SYMBOLS.BELL, SYMBOLS.BELL,
    SYMBOLS.BAR,
    SYMBOLS.SEVEN,
    SYMBOLS.WILD,
    SYMBOLS.SCATTER
  ],
  // Reel 5 (tighter)
  [
    SYMBOLS.LEMON, SYMBOLS.LEMON,
    SYMBOLS.CHERRY, SYMBOLS.CHERRY,
    SYMBOLS.GRAPE, SYMBOLS.GRAPE,
    SYMBOLS.BELL,
    SYMBOLS.BAR,
    SYMBOLS.SEVEN,
    SYMBOLS.WILD,
    SYMBOLS.SCATTER
  ]
];

// Paytable: multipliers for matching symbols (3, 4, 5 symbols)
const PAYTABLE = {
  [SYMBOLS.LEMON]: [3, 10, 25],
  [SYMBOLS.CHERRY]: [5, 15, 40],
  [SYMBOLS.GRAPE]: [8, 20, 60],
  [SYMBOLS.BELL]: [10, 30, 100],
  [SYMBOLS.BAR]: [15, 50, 200],
  [SYMBOLS.SEVEN]: [50, 200, 1000],
  [SYMBOLS.WILD]: [0, 0, 0], // Wild doesn't pay on its own
  [SYMBOLS.SCATTER]: [0, 0, 0] // Scatter uses special logic
};

// Scatter payouts (3, 4, 5 scatters anywhere)
const SCATTER_PAYOUTS = [10, 50, 250];

// Payline definitions (row indices for each reel)
const PAYLINES = [
  [1, 1, 1, 1, 1], // Middle line
  [0, 0, 0, 0, 0], // Top line
  [2, 2, 2, 2, 2], // Bottom line
  [0, 1, 2, 1, 0], // V shape
  [2, 1, 0, 1, 2]  // Inverted V
];

// Generate deterministic random number from hash
function seededRandom(serverSeed, clientSeed, nonce, index) {
  const hash = crypto.createHash('sha256')
    .update(`${serverSeed}:${clientSeed}:${nonce}:${index}`)
    .digest('hex');
  
  // Use first 8 characters of hash and convert to number 0-1
  return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}

// Spin reels using provably fair RNG
function spinReels(serverSeed, clientSeed, nonce) {
  const grid = [];
  
  for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
    const strip = REEL_STRIPS[reelIndex];
    const random = seededRandom(serverSeed, clientSeed, nonce, reelIndex);
    const stopPosition = Math.floor(random * strip.length);
    
    // Get 3 consecutive symbols from strip (wrap around)
    const reel = [];
    for (let i = 0; i < 3; i++) {
      reel.push(strip[(stopPosition + i) % strip.length]);
    }
    
    grid.push(reel);
  }
  
  return grid;
}

// Evaluate a payline for wins
function evaluatePayline(grid, payline) {
  const symbols = payline.map((row, col) => grid[col][row]);
  
  // Check for scatter symbols (they don't count on paylines)
  if (symbols.some(s => s === SYMBOLS.SCATTER)) {
    return null;
  }
  
  // Start with first symbol (or wild)
  let matchSymbol = symbols[0] === SYMBOLS.WILD ? null : symbols[0];
  let matchCount = 0;
  
  for (const symbol of symbols) {
    if (symbol === SYMBOLS.WILD) {
      matchCount++;
    } else if (matchSymbol === null) {
      matchSymbol = symbol;
      matchCount++;
    } else if (symbol === matchSymbol) {
      matchCount++;
    } else {
      break;
    }
  }
  
  // Need at least 3 matching symbols
  if (matchCount >= 3 && matchSymbol) {
    const multipliers = PAYTABLE[matchSymbol];
    const multiplier = multipliers[matchCount - 3] || 0;
    
    return {
      symbol: matchSymbol,
      count: matchCount,
      multiplier
    };
  }
  
  return null;
}

// Count scatters anywhere on grid
function evaluateScatters(grid) {
  let scatterCount = 0;
  
  for (const reel of grid) {
    for (const symbol of reel) {
      if (symbol === SYMBOLS.SCATTER) {
        scatterCount++;
      }
    }
  }
  
  if (scatterCount >= 3) {
    return {
      count: scatterCount,
      multiplier: SCATTER_PAYOUTS[scatterCount - 3] || SCATTER_PAYOUTS[SCATTER_PAYOUTS.length - 1]
    };
  }
  
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { bet_per_line, lines, client_seed } = await req.json();
    
    // Validate inputs
    if (!bet_per_line || !lines || !client_seed) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    if (![1, 3, 5].includes(lines)) {
      return Response.json({ error: 'Lines must be 1, 3, or 5' }, { status: 400 });
    }
    
    // Get house config
    const configs = await base44.asServiceRole.entities.HouseConfig.list();
    const houseConfig = configs[0];
    
    if (!houseConfig?.slots_enabled) {
      return Response.json({ error: 'Slots are currently disabled' }, { status: 403 });
    }
    
    if (bet_per_line < houseConfig.min_bet_per_line || bet_per_line > houseConfig.max_bet_per_line) {
      return Response.json({ 
        error: `Bet per line must be between ${houseConfig.min_bet_per_line} and ${houseConfig.max_bet_per_line}` 
      }, { status: 400 });
    }
    
    // Get player
    const players = await base44.entities.Player.filter({ created_by: user.email });
    const player = players[0];
    
    if (!player) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }
    
    const totalBet = bet_per_line * lines;
    
    if (player.points_balance < totalBet) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    
    // Generate server seed (in production, store this securely per player)
    const serverSeed = crypto.createHash('sha256')
      .update(`${player.id}:${Date.now()}:${Math.random()}`)
      .digest('hex');
    
    const serverSeedHash = crypto.createHash('sha256')
      .update(serverSeed)
      .digest('hex');
    
    // Get player's nonce (increment per spin)
    const lastSession = await base44.asServiceRole.entities.SlotSession.filter(
      { player_id: player.id },
      '-created_date',
      1
    );
    const nonce = lastSession[0]?.nonce ? lastSession[0].nonce + 1 : 0;
    
    // Spin the reels
    const grid = spinReels(serverSeed, client_seed, nonce);
    
    // Evaluate wins
    const lineWins = [];
    let totalWin = 0;
    
    // Evaluate paylines based on lines played
    const activePaylines = PAYLINES.slice(0, lines);
    
    for (let i = 0; i < activePaylines.length; i++) {
      const win = evaluatePayline(grid, activePaylines[i]);
      
      if (win) {
        const payout = bet_per_line * win.multiplier;
        lineWins.push({
          line: i + 1,
          symbol: win.symbol,
          count: win.count,
          multiplier: win.multiplier,
          payout
        });
        totalWin += payout;
      }
    }
    
    // Evaluate scatter wins (based on total bet)
    const scatterWin = evaluateScatters(grid);
    let scatterPayout = 0;
    
    if (scatterWin) {
      scatterPayout = totalBet * scatterWin.multiplier;
      totalWin += scatterPayout;
    }
    
    // Calculate jackpot contribution
    let jackpotContribution = 0;
    if (houseConfig.jackpot_enabled) {
      jackpotContribution = Math.floor(totalBet * (houseConfig.jackpot_contribution_pct / 100));
    }
    
    // Check for jackpot win (5 sevens on any line)
    let jackpotWon = false;
    for (const payline of activePaylines) {
      const symbols = payline.map((row, col) => grid[col][row]);
      if (symbols.every(s => s === SYMBOLS.SEVEN)) {
        jackpotWon = true;
        totalWin += houseConfig.jackpot_pool;
        break;
      }
    }
    
    const netResult = totalWin - totalBet;
    const newBalance = player.points_balance + netResult - jackpotContribution;
    
    // Batch all database operations in parallel for speed
    const updates = [
      // Create slot session
      base44.asServiceRole.entities.SlotSession.create({
        player_id: player.id,
        bet_per_line,
        lines_played: lines,
        total_bet: totalBet,
        total_win: totalWin,
        net_result: netResult,
        jackpot_contribution: jackpotContribution,
        jackpot_won: jackpotWon,
        client_seed,
        server_seed_hash: serverSeedHash,
        nonce,
        reel_results: grid,
        line_wins: lineWins,
        scatter_win: scatterWin ? { count: scatterWin.count, payout: scatterPayout } : null
      }),
      
      // Update player stats
      base44.asServiceRole.entities.Player.update(player.id, {
        points_balance: newBalance,
        total_wagered: player.total_wagered + totalBet,
        total_won: player.total_won + totalWin,
        games_played: player.games_played + 1,
        biggest_win: Math.max(player.biggest_win || 0, totalWin),
        xp: player.xp + Math.floor(totalBet / 10) + (netResult > 0 ? 15 : 0),
        slots_games_played: (player.slots_games_played || 0) + 1,
        slots_total_bet: (player.slots_total_bet || 0) + totalBet
      })
    ];
    
    // Add jackpot pool update if needed
    if (jackpotContribution > 0) {
      updates.push(
        base44.asServiceRole.entities.HouseConfig.update(houseConfig.id, {
          jackpot_pool: jackpotWon ? 0 : houseConfig.jackpot_pool + jackpotContribution
        })
      );
    }
    
    // Execute all updates in parallel
    const [session] = await Promise.all(updates);
    
    // Generate unique spin ID
    const spin_id = crypto.randomUUID();
    
    // Calculate total bet for win tier
    const total_bet = totalBet;
    
    return Response.json({
      success: true,
      spin_id,
      grid,
      line_wins: lineWins,
      scatter_win: scatterWin ? { count: scatterWin.count, payout: scatterPayout } : null,
      total_bet,
      total_win: totalWin,
      net_result: netResult,
      jackpot_contribution: jackpotContribution,
      jackpot_won: jackpotWon,
      jackpot_amount: jackpotWon ? houseConfig.jackpot_pool : 0,
      new_balance: newBalance,
      session_id: session.id,
      server_seed_hash: serverSeedHash,
      nonce
    });
    
  } catch (error) {
    console.error('Spin error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});