import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy, Info, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Symbol = ({ symbol, highlight = false, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`text-4xl sm:text-5xl flex items-center justify-center h-full ${
        highlight ? 'animate-pulse' : ''
      }`}
    >
      {symbol}
    </motion.div>
  );
};

const ReelColumn = ({ symbols, spinning, delay, highlightRows = [], fastMode = false }) => {
  const [displaySymbols, setDisplaySymbols] = useState(symbols);
  const [spinningState, setSpinningState] = useState(false);

  const allSymbols = ['🍋', '🍒', '🍇', '🔔', '💎', '7️⃣', '⭐', '💰'];

  useEffect(() => {
    if (spinning) {
      setSpinningState(true);
      const spinDuration = fastMode ? 300 : 1500;
      
      const interval = setInterval(() => {
        setDisplaySymbols(
          Array(3).fill(0).map(() => allSymbols[Math.floor(Math.random() * allSymbols.length)])
        );
      }, 50);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setSpinningState(false);
      }, spinDuration + delay);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [spinning, delay, fastMode]);

  // Separate effect to update displayed symbols only when not spinning
  useEffect(() => {
    if (!spinning && !spinningState) {
      setDisplaySymbols(symbols);
    }
  }, [spinning, spinningState, symbols]);

  return (
    <div className="flex flex-col gap-1">
      {displaySymbols.map((symbol, idx) => (
        <div
          key={idx}
          className={`w-16 sm:w-20 h-16 sm:h-20 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border-2 flex items-center justify-center relative overflow-hidden ${
            highlightRows.includes(idx)
              ? 'border-amber-400 shadow-lg shadow-amber-400/50'
              : 'border-slate-700'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          {spinningState ? (
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
  const lineStyles = [
    'middle', // Line 1: middle row
    'top',    // Line 2: top row
    'bottom', // Line 3: bottom row
    'v',      // Line 4: V shape
    'invV'    // Line 5: inverted V
  ];

  const winColors = [
    'from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)]',
    'from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]',
    'from-transparent via-green-400 to-transparent shadow-[0_0_20px_rgba(74,222,128,0.8)]',
    'from-transparent via-pink-400 to-transparent shadow-[0_0_20px_rgba(244,114,182,0.8)]',
    'from-transparent via-purple-400 to-transparent shadow-[0_0_20px_rgba(192,132,252,0.8)]',
  ];

  const randomColor = winColors[line % winColors.length];
  const colorClass = isWinning ? randomColor : 'from-transparent via-slate-400 to-transparent';
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
  const [grid, setGrid] = useState(Array(5).fill(['🍋', '🍋', '🍋']));
  const [spinning, setSpinning] = useState(false);
  const [betPerLine, setBetPerLine] = useState(5);
  const [lines, setLines] = useState(1);
  const [clientSeed, setClientSeed] = useState(Math.random().toString(36).substring(7));
  const [lastResult, setLastResult] = useState(null);
  const [highlightedLines, setHighlightedLines] = useState([]);
  const [fastMode, setFastMode] = useState(false);

  useEffect(() => {
    if (houseConfig?.min_bet_per_line && betPerLine < houseConfig.min_bet_per_line) {
      setBetPerLine(houseConfig.min_bet_per_line);
    }
  }, [houseConfig]);

  const totalBet = betPerLine * lines;
  const minBet = houseConfig?.min_bet_per_line || 1;
  const maxBet = houseConfig?.max_bet_per_line || 100;

  const spin = async () => {
    if (spinning || balance < totalBet) return;
    if (!houseConfig?.slots_enabled) {
      alert('Slots are currently disabled by the house');
      return;
    }

    const seedToUse = clientSeed;

    setSpinning(true);
    setLastResult(null);
    setHighlightedLines([]);

    try {
      const response = await base44.functions.invoke('spinSlots', {
        bet_per_line: betPerLine,
        lines: lines,
        client_seed: seedToUse
      });

      const result = response.data;

      const animationDuration = fastMode ? 500 : 2000;
      
      // Set final grid immediately but keep spinning true until animation completes
      setGrid(result.grid);
      
      setTimeout(() => {
        setSpinning(false);
        setLastResult(result);

        // Highlight winning lines
        if (result.line_wins?.length > 0) {
          setHighlightedLines(result.line_wins.map(w => w.line));
        }

        onSpinComplete(result);

        // Generate new client seed for next spin
        setClientSeed(Math.random().toString(36).substring(7));

        // Auto-dismiss result after 1.2 seconds
        setTimeout(() => {
          setLastResult(null);
          setHighlightedLines([]);
        }, 1200);
      }, animationDuration);
    } catch (error) {
      console.error('Spin error:', error);
      
      // Report error to Dev Center Ops
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
      setSpinning(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 border border-purple-500/20 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            5×3 SLOTS
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">Provably fair • {lines} {lines === 1 ? 'line' : 'lines'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFastMode(!fastMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              fastMode 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ⚡ {fastMode ? 'Fast' : 'Normal'}
          </button>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-bold text-lg">
              Jackpot: {(houseConfig.jackpot_pool || 0).toLocaleString()} pts
            </span>
          </div>
        </div>
      )}

      {/* Slot Grid */}
      <div className="relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-2xl p-4 mb-6 border border-slate-700">
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
              key={idx}
              symbols={reel}
              spinning={spinning}
              delay={idx * 100}
              highlightRows={[]}
              fastMode={fastMode}
            />
          ))}
        </div>

        {/* Result Display - Overlay */}
        <AnimatePresence>
          {lastResult && !spinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-md"
            >
            <Card className={`${
              lastResult.jackpot_won
                ? 'bg-gradient-to-r from-amber-500/90 to-yellow-500/90 border-amber-400 shadow-2xl shadow-amber-500/50'
                : lastResult.total_win > 0
                ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90 border-green-400 shadow-2xl shadow-green-500/50'
                : 'bg-gradient-to-r from-red-500/90 to-red-600/90 border-red-400 shadow-2xl shadow-red-500/50'
            } backdrop-blur-sm`}>
              <CardContent className="p-6 text-center">
                {lastResult.jackpot_won && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    <p className="text-2xl font-black text-white">JACKPOT!!!</p>
                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  </div>
                )}
                <p className="text-4xl font-black text-white">
                  {lastResult.net_result > 0 ? '+' : ''}{lastResult.net_result.toLocaleString()} pts
                </p>
                {lastResult.line_wins?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {lastResult.line_wins.map((win, idx) => (
                      <p key={idx} className="text-sm text-white/80">
                        Line {win.line}: {win.symbol} ×{win.count} = {win.payout}pts
                      </p>
                    ))}
                  </div>
                )}
                {lastResult.scatter_win && (
                  <p className="text-sm text-white/80 mt-2">
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
                if (!spinning && val >= minBet && val <= maxBet) {
                  setBetPerLine(val);
                }
              }}
              disabled={spinning}
              className="w-24 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-white font-bold text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
              min={minBet}
              max={maxBet}
            />
          </div>
          {betPerLine >= maxBet && (
            <p className="text-amber-400 text-xs mb-2">Max bet limit reached</p>
          )}
          <div className="flex gap-2 mb-3">
            {[1, 5, 10, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  if (!spinning) {
                    const newAmount = betPerLine + amount;
                    const totalBet = newAmount * lines;
                    if (totalBet <= balance && newAmount <= maxBet) {
                      setBetPerLine(newAmount);
                    }
                  }
                }}
                disabled={spinning}
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-105"
              >
                +{amount}
              </button>
            ))}
            <button
              onClick={() => !spinning && setBetPerLine(minBet)}
              disabled={spinning}
              className="px-3 py-2 rounded-lg font-bold text-sm transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 hover:scale-105"
            >
              CLR
            </button>
            {houseConfig?.max_bet_button_enabled && (
              <button
                onClick={() => !spinning && setBetPerLine(Math.min(Math.floor(balance / lines), maxBet))}
                disabled={spinning}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-all bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30 hover:scale-105"
              >
                MAX
              </button>
            )}
          </div>
          <div className="relative">
            <Slider
              value={[betPerLine]}
              onValueChange={([val]) => !spinning && setBetPerLine(val)}
              min={minBet}
              max={maxBet}
              step={1}
              disabled={spinning}
              className="cursor-pointer [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-2 [&_[role=slider]]:border-purple-300 [&_[role=slider]]:shadow-lg"
            />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>{minBet}</span>
              <span>{maxBet}</span>
            </div>
          </div>
        </div>

        {/* Paylines */}
        <div>
          <p className="text-slate-400 text-sm mb-2">Paylines</p>
          <div className="flex gap-2">
            {[1, 3, 5].map((num) => (
              <button
                key={num}
                onClick={() => !spinning && setLines(num)}
                disabled={spinning}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  lines === num
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {num} {num === 1 ? 'Line' : 'Lines'}
              </button>
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <Button
          onClick={spin}
          disabled={spinning || balance < totalBet || !houseConfig?.slots_enabled}
          className="w-full h-14 text-xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-400 hover:via-pink-400 hover:to-purple-400 text-white rounded-xl shadow-lg shadow-purple-500/30 disabled:opacity-50"
        >
          {spinning ? (
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