import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy, Info, Sparkles, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { soundManager } from './SoundManager';

// Slot machine states
const STATES = {
  IDLE: 'IDLE',
  BETTING_LOCKED: 'BETTING_LOCKED',
  SPINNING: 'SPINNING',
  RESULT_LOCKED: 'RESULT_LOCKED',
  CELEBRATING: 'CELEBRATING',
};

const Symbol = ({ symbol, highlight = false }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: highlight ? 1.1 : 1 }}
    className={`text-4xl sm:text-5xl flex items-center justify-center h-full ${
      highlight ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''
    }`}
  >
    {symbol}
  </motion.div>
);

const ReelColumn = ({ finalSymbols, spinning, delay, highlightRows = [], reducedMotion = false, activeSpinId, spinId }) => {
  const [displaySymbols, setDisplaySymbols] = useState(finalSymbols);
  const [isSpinning, setIsSpinning] = useState(false);
  const timerRef = useRef(null);

  const allSymbols = ['🍋', '🍒', '🍇', '🔔', '💎', '7️⃣', '⭐', '💰'];

  useEffect(() => {
    // Ignore stale callbacks
    if (spinId !== activeSpinId) return;

    if (spinning && !reducedMotion) {
      setIsSpinning(true);
      
      const interval = setInterval(() => {
        setDisplaySymbols(
          Array(3).fill(0).map(() => allSymbols[Math.floor(Math.random() * allSymbols.length)])
        );
      }, 50);

      timerRef.current = setTimeout(() => {
        clearInterval(interval);
        setDisplaySymbols(finalSymbols);
        setIsSpinning(false);
      }, 800 + delay);

      return () => {
        clearInterval(interval);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (spinning && reducedMotion) {
      // Instant reveal for reduced motion
      setDisplaySymbols(finalSymbols);
    }
  }, [spinning, delay, finalSymbols, reducedMotion, spinId, activeSpinId]);

  // Update symbols when not spinning
  useEffect(() => {
    if (!isSpinning) {
      setDisplaySymbols(finalSymbols);
    }
  }, [finalSymbols, isSpinning]);

  return (
    <div className="flex flex-col gap-1">
      {displaySymbols.map((symbol, idx) => (
        <div
          key={idx}
          className={`w-16 sm:w-20 h-16 sm:h-20 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border-2 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
            highlightRows.includes(idx)
              ? 'border-amber-400 shadow-lg shadow-amber-400/50 scale-105'
              : 'border-slate-700'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          {isSpinning ? (
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.1, repeat: Infinity }}
              className="text-3xl"
            >
              {symbol}
            </motion.div>
          ) : (
            <Symbol symbol={symbol} highlight={highlightRows.includes(idx)} />
          )}
        </div>
      ))}
    </div>
  );
};

const PaylineIndicator = ({ line, active, isWinning }) => {
  const lineStyles = ['middle', 'top', 'bottom', 'v', 'invV'];
  const winColors = [
    'from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)]',
    'from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]',
    'from-transparent via-green-400 to-transparent shadow-[0_0_20px_rgba(74,222,128,0.8)]',
    'from-transparent via-pink-400 to-transparent shadow-[0_0_20px_rgba(244,114,182,0.8)]',
    'from-transparent via-purple-400 to-transparent shadow-[0_0_20px_rgba(192,132,252,0.8)]',
  ];

  const colorClass = isWinning ? winColors[line % winColors.length] : 'from-transparent via-slate-400 to-transparent';
  const heightClass = isWinning ? 'h-1' : 'h-0.5';

  return (
    <div className={`absolute inset-0 pointer-events-none ${active ? 'opacity-100' : 'opacity-30'} ${isWinning ? 'animate-pulse' : ''}`}>
      {lineStyles[line - 1] === 'middle' && (
        <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 ${heightClass} bg-gradient-to-r ${colorClass}`} />
      )}
      {lineStyles[line - 1] === 'top' && (
        <div className={`absolute left-0 right-0 top-[16.66%] ${heightClass} bg-gradient-to-r ${colorClass}`} />
      )}
      {lineStyles[line - 1] === 'bottom' && (
        <div className={`absolute left-0 right-0 bottom-[16.66%] ${heightClass} bg-gradient-to-r ${colorClass}`} />
      )}
    </div>
  );
};

export default function AdvancedSlotMachine({ balance, onSpinComplete, houseConfig }) {
  const [state, setState] = useState(STATES.IDLE);
  const [grid, setGrid] = useState(Array(5).fill(['🍋', '🍋', '🍋']));
  const [betPerLine, setBetPerLine] = useState(5);
  const [lines, setLines] = useState(1);
  const [clientSeed, setClientSeed] = useState(Math.random().toString(36).substring(7));
  const [lastResult, setLastResult] = useState(null);
  const [highlightedLines, setHighlightedLines] = useState([]);
  const [fastMode, setFastMode] = useState(houseConfig?.slots_fast_mode_default || false);
  const [activeSpinId, setActiveSpinId] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const celebrationTimerRef = useRef(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches || houseConfig?.slots_force_reduced_motion);

    const handler = (e) => setReducedMotion(e.matches || houseConfig?.slots_force_reduced_motion);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [houseConfig]);

  const getHighlightedRows = useCallback((reelIdx) => {
    const rows = [];
    highlightedLines.forEach(line => {
      if (line === 1) rows.push(1);
      else if (line === 2) rows.push(0);
      else if (line === 3) rows.push(2);
      else if (line === 4) rows.push(reelIdx === 0 || reelIdx === 4 ? 2 : reelIdx === 1 || reelIdx === 3 ? 1 : 0);
      else if (line === 5) rows.push(reelIdx === 0 || reelIdx === 4 ? 0 : reelIdx === 1 || reelIdx === 3 ? 1 : 2);
    });
    return [...new Set(rows)];
  }, [highlightedLines]);

  useEffect(() => {
    if (houseConfig?.min_bet_per_line && betPerLine < houseConfig.min_bet_per_line) {
      setBetPerLine(houseConfig.min_bet_per_line);
    }
  }, [houseConfig, betPerLine]);

  const totalBet = betPerLine * lines;
  const minBet = houseConfig?.min_bet_per_line || 1;
  const maxBet = houseConfig?.max_bet_per_line || 100;

  const spin = async () => {
    if (state !== STATES.IDLE || balance < totalBet) return;
    if (!houseConfig?.slots_enabled) {
      alert('Slots are currently disabled');
      return;
    }

    const seedToUse = clientSeed;
    const spinId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    setActiveSpinId(spinId);
    setState(STATES.BETTING_LOCKED);
    setLastResult(null);
    setHighlightedLines([]);

    // Play spin sound
    soundManager.play('spin');

    try {
      setState(STATES.SPINNING);

      const response = await base44.functions.invoke('spinSlots', {
        bet_per_line: betPerLine,
        lines: lines,
        client_seed: seedToUse
      });

      const result = response.data;

      // Verify spin ID matches
      if (spinId !== activeSpinId) {
        console.warn('Stale spin callback, ignoring');
        return;
      }

      // Update grid immediately (locked, immutable)
      setGrid(result.grid);

      // Wait for reels to stop
      const spinDuration = reducedMotion ? 0 : (fastMode ? 800 : 1500);
      
      setTimeout(() => {
        if (spinId !== activeSpinId) return;

        setState(STATES.RESULT_LOCKED);
        setLastResult(result);

        // Play result sound
        if (result.jackpot_won) {
          soundManager.play('jackpot');
        } else if (result.total_win > result.total_bet * 10) {
          soundManager.play('bigWin');
        } else if (result.total_win > 0) {
          soundManager.play('win');
        } else {
          soundManager.play('loss');
        }

        // Highlight winning lines
        if (result.line_wins?.length > 0) {
          setHighlightedLines(result.line_wins.map(w => w.line));
        }

        // Report result
        onSpinComplete(result);

        // New client seed
        setClientSeed(Math.random().toString(36).substring(7));

        // Move to celebration
        setState(STATES.CELEBRATING);

        // Auto-dismiss based on win tier
        const winMultiplier = result.total_win / result.total_bet;
        const celebrationDuration = result.jackpot_won ? 2000 : winMultiplier > 10 ? 1500 : winMultiplier > 2 ? 1200 : 800;

        celebrationTimerRef.current = setTimeout(() => {
          if (spinId !== activeSpinId) return;
          
          setLastResult(null);
          setHighlightedLines([]);
          setState(STATES.IDLE);
        }, celebrationDuration);
      }, spinDuration);
    } catch (error) {
      console.error('Spin error:', error);
      
      // Report error
      try {
        await base44.functions.invoke('reportAppError', {
          app_name: 'The Backrooms',
          app_id: 'the-backrooms',
          error_message: error.response?.data?.error || error.message,
          error_stack: error.stack,
          severity: 'critical',
          user_affected: 'player',
          metadata: {
            game_type: 'slots',
            bet_amount: totalBet,
            balance: balance
          }
        });
      } catch (reportErr) {
        console.error('Failed to report error:', reportErr);
      }
      
      alert(error.response?.data?.error || 'Spin failed');
      setState(STATES.IDLE);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-8 border border-purple-500/20 shadow-2xl relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            5×3 SLOTS
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">Provably fair • {lines} {lines === 1 ? 'line' : 'lines'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!reducedMotion && (
            <button
              onClick={() => setFastMode(!fastMode)}
              disabled={state !== STATES.IDLE}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                fastMode 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              {fastMode ? 'Fast' : 'Normal'}
            </button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <Info className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Paytable & Rules</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-bold text-white mb-2">How to Play</h3>
                  <ul className="text-slate-300 space-y-1 list-disc list-inside">
                    <li>Select bet per line and number of paylines (1, 3, or 5)</li>
                    <li>Match 3+ symbols on an active payline to win</li>
                    <li>⭐ WILD substitutes for any symbol except SCATTER</li>
                    <li>💰 SCATTER pays anywhere (3+ symbols)</li>
                    <li>Line up 5× 7️⃣ on any line to win the JACKPOT!</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-2">Symbol Payouts (× bet per line)</h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>🍋 Lemon: 3×, 10×, 25×</div>
                    <div>🍒 Cherry: 5×, 15×, 40×</div>
                    <div>🍇 Grape: 8×, 20×, 60×</div>
                    <div>🔔 Bell: 10×, 30×, 100×</div>
                    <div>💎 Diamond: 15×, 50×, 200×</div>
                    <div>7️⃣ Seven: 50×, 200×, 1000×</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-2">Scatter Bonus (× total bet)</h3>
                  <p className="text-slate-300">3 💰 = 10×  |  4 💰 = 50×  |  5 💰 = 250×</p>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="font-bold text-white mb-2">Provably Fair</h3>
                  <p className="text-slate-400 text-xs">
                    Every spin uses your client seed + server seed + nonce. 
                    Results are deterministic and verifiable via SHA-256 hashing.
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Client Seed: <code className="bg-slate-800 px-1 rounded">{clientSeed}</code>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Jackpot Display */}
      {houseConfig?.jackpot_enabled && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-amber-300 font-bold text-sm sm:text-base lg:text-lg">
              Jackpot: {typeof houseConfig.jackpot_pool === 'number' ? houseConfig.jackpot_pool.toLocaleString() : '0'} pts
            </span>
          </div>
        </div>
      )}

      {/* Slot Grid */}
      <div className="relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 mb-4 sm:mb-6 border border-slate-700">
        {/* Payline overlays */}
        {[1, 2, 3, 4, 5].map(line => (
          <PaylineIndicator 
            key={line} 
            line={line} 
            active={lines >= line}
            isWinning={highlightedLines.includes(line)}
          />
        ))}

        <div className="flex justify-center gap-2 relative z-10">
          {grid.map((reel, idx) => (
            <ReelColumn
              key={`reel-${idx}`}
              finalSymbols={reel}
              spinning={state === STATES.SPINNING}
              delay={idx * 100}
              highlightRows={highlightedLines.length > 0 ? getHighlightedRows(idx) : []}
              reducedMotion={reducedMotion}
              activeSpinId={activeSpinId}
              spinId={activeSpinId}
            />
          ))}
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {lastResult && state === STATES.CELEBRATING && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-md"
            >
              <Card className={`${
                lastResult.jackpot_won
                  ? 'bg-gradient-to-r from-amber-500/95 to-yellow-500/95 border-amber-400'
                  : lastResult.total_win > lastResult.total_bet * 10
                  ? 'bg-gradient-to-r from-purple-500/95 to-pink-500/95 border-purple-400'
                  : lastResult.total_win > 0
                  ? 'bg-gradient-to-r from-green-500/95 to-emerald-500/95 border-green-400'
                  : 'bg-gradient-to-r from-slate-700/95 to-slate-800/95 border-slate-600'
              } backdrop-blur-sm shadow-2xl`}>
                <CardContent className="p-4 sm:p-6 text-center">
                  {lastResult.jackpot_won && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      <p className="text-2xl font-black text-white">JACKPOT!!!</p>
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                  )}
                  {!lastResult.jackpot_won && lastResult.total_win > lastResult.total_bet * 10 && (
                    <p className="text-xl font-black text-white mb-1">MASSIVE WIN!</p>
                  )}
                  {!lastResult.jackpot_won && lastResult.total_win > lastResult.total_bet * 2 && lastResult.total_win <= lastResult.total_bet * 10 && (
                    <p className="text-lg font-bold text-white mb-1">BIG WIN!</p>
                  )}
                  <p className="text-3xl sm:text-4xl font-black text-white">
                    {lastResult.net_result > 0 ? '+' : ''}{lastResult.net_result.toLocaleString()} pts
                  </p>
                  {lastResult.line_wins?.length > 0 && (
                    <div className="mt-2 space-y-0.5 text-xs sm:text-sm">
                      {lastResult.line_wins.slice(0, 3).map((win, idx) => (
                        <p key={idx} className="text-white/90">
                          Line {win.line}: {win.symbol} ×{win.count} = {win.payout}pts
                        </p>
                      ))}
                    </div>
                  )}
                  {lastResult.scatter_win && (
                    <p className="text-xs sm:text-sm text-white/90 mt-1">
                      Scatter: {lastResult.scatter_win.count}× 💰 = {lastResult.scatter_win.payout}pts
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Bet Per Line */}
        <div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-400">Bet Per Line <span className="text-slate-500 text-xs">(Max: {maxBet})</span></span>
            <input
              type="number"
              value={betPerLine}
              onChange={(e) => {
                const val = parseInt(e.target.value) || minBet;
                if (state === STATES.IDLE && val >= minBet && val <= maxBet) {
                  setBetPerLine(val);
                }
              }}
              disabled={state !== STATES.IDLE}
              className="w-24 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-white font-bold text-right focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              min={minBet}
              max={maxBet}
            />
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {[1, 5, 10, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  if (state === STATES.IDLE) {
                    const newAmount = Math.min(betPerLine + amount, maxBet);
                    setBetPerLine(newAmount);
                  }
                }}
                disabled={state !== STATES.IDLE}
                className="flex-1 min-w-[60px] py-2 rounded-lg font-semibold text-sm transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                +{amount}
              </button>
            ))}
            <button
              onClick={() => state === STATES.IDLE && setBetPerLine(minBet)}
              disabled={state !== STATES.IDLE}
              className="px-3 py-2 rounded-lg font-bold text-sm transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 hover:scale-105 disabled:opacity-50"
            >
              CLR
            </button>
            {houseConfig?.max_bet_button_enabled && (
              <button
                onClick={() => state === STATES.IDLE && setBetPerLine(Math.min(Math.floor(balance / lines), maxBet))}
                disabled={state !== STATES.IDLE}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-all bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30 hover:scale-105 disabled:opacity-50"
              >
                MAX
              </button>
            )}
          </div>
          <Slider
            value={[betPerLine]}
            onValueChange={([val]) => state === STATES.IDLE && setBetPerLine(val)}
            min={minBet}
            max={maxBet}
            step={1}
            disabled={state !== STATES.IDLE}
            className="cursor-pointer"
          />
        </div>

        {/* Paylines */}
        <div>
          <p className="text-slate-400 text-sm mb-2">Paylines</p>
          <div className="flex gap-2">
            {[1, 3, 5].map((num) => (
              <button
                key={num}
                onClick={() => state === STATES.IDLE && setLines(num)}
                disabled={state !== STATES.IDLE}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  lines === num
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {num} {num === 1 ? 'Line' : 'Lines'}
              </button>
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <Button
          onClick={spin}
          disabled={state !== STATES.IDLE || balance < totalBet || !houseConfig?.slots_enabled}
          className="w-full h-14 text-xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-400 hover:via-pink-400 hover:to-purple-400 text-white rounded-xl shadow-lg shadow-purple-500/30 disabled:opacity-50"
        >
          {state === STATES.SPINNING ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            `SPIN - ${totalBet} pts`
          )}
        </Button>

        {balance < totalBet && (
          <p className="text-red-400 text-sm text-center">Insufficient balance</p>
        )}
      </div>
    </div>
  );
}