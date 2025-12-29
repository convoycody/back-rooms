import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐'];
const SYMBOL_WEIGHTS = [25, 20, 18, 15, 12, 5, 5]; // 777 is rare

const PAYOUTS = {
  '7️⃣7️⃣7️⃣': { multiplier: 50, name: 'JACKPOT!' },
  '💎💎💎': { multiplier: 25, name: 'Diamond Rush!' },
  '⭐⭐⭐': { multiplier: 20, name: 'Star Aligned!' },
  '🍇🍇🍇': { multiplier: 10, name: 'Grape Crush!' },
  '🍊🍊🍊': { multiplier: 8, name: 'Orange Burst!' },
  '🍋🍋🍋': { multiplier: 6, name: 'Lemon Drop!' },
  '🍒🍒🍒': { multiplier: 5, name: 'Cherry Bomb!' },
  '7️⃣7️⃣': { multiplier: 5, name: 'Lucky Sevens!' },
  '💎💎': { multiplier: 3, name: 'Double Diamonds!' },
  '🍒🍒': { multiplier: 2, name: 'Double Cherry!' },
};

const getWeightedSymbol = () => {
  const totalWeight = SYMBOL_WEIGHTS.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < SYMBOLS.length; i++) {
    random -= SYMBOL_WEIGHTS[i];
    if (random <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
};

const checkWin = (reels) => {
  const key3 = reels.join('');
  if (PAYOUTS[key3]) return PAYOUTS[key3];
  
  const key2 = reels.slice(0, 2).join('');
  if (PAYOUTS[key2]) return PAYOUTS[key2];
  
  if (reels[0] === reels[1] || reels[1] === reels[2]) {
    return { multiplier: 1.5, name: 'Small Win!' };
  }
  
  return null;
};

const Reel = ({ symbol, spinning, delay }) => {
  const [displaySymbols, setDisplaySymbols] = useState([symbol, symbol, symbol]);
  
  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        setDisplaySymbols([
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ]);
      }, 80);
      
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplaySymbols([symbol, symbol, symbol]);
      }, 1500 + delay);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplaySymbols([symbol, symbol, symbol]);
    }
  }, [spinning, symbol, delay]);

  return (
    <div className="relative w-24 h-28 overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-amber-500/30 shadow-lg shadow-amber-500/10">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 z-10 pointer-events-none" />
      <motion.div 
        className="flex flex-col items-center justify-center"
        animate={spinning ? { y: [-20, 0] } : {}}
        transition={{ duration: 0.08, repeat: spinning ? Infinity : 0 }}
      >
        <span className="text-5xl py-8 filter drop-shadow-lg">{displaySymbols[1]}</span>
      </motion.div>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
    </div>
  );
};

export default function SlotMachine({ balance, onSpin, disabled }) {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [lastWin, setLastWin] = useState(null);
  const [showJackpot, setShowJackpot] = useState(false);

  const betOptions = [10, 25, 50, 100, 250, 500];

  const spin = async () => {
    if (spinning || balance < betAmount) return;
    
    setSpinning(true);
    setLastWin(null);
    
    // Generate results
    const newReels = [getWeightedSymbol(), getWeightedSymbol(), getWeightedSymbol()];
    
    // Wait for animation
    setTimeout(() => {
      setReels(newReels);
    }, 500);
    
    setTimeout(() => {
      setSpinning(false);
      const win = checkWin(newReels);
      
      if (win) {
        setLastWin(win);
        if (win.multiplier >= 50) {
          setShowJackpot(true);
          setTimeout(() => setShowJackpot(false), 3000);
        }
      }
      
      onSpin({
        bet: betAmount,
        reels: newReels,
        win: win,
        payout: win ? Math.floor(betAmount * win.multiplier) : 0
      });
    }, 2500);
  };

  return (
    <div className="relative">
      {/* Jackpot Overlay */}
      <AnimatePresence>
        {showJackpot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-3xl"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-8xl mb-4"
              >
                🎰
              </motion.div>
              <motion.h2
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent"
              >
                JACKPOT!
              </motion.h2>
              <p className="text-2xl text-amber-400 mt-2">+{Math.floor(betAmount * 50)} points!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/20 shadow-2xl shadow-amber-500/5">
        {/* Machine Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent tracking-tight">
            TRIPLE SEVENS
          </h2>
          <p className="text-slate-400 text-sm mt-1">Match 3 to win big!</p>
        </div>

        {/* Reels Container */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="flex justify-center gap-3">
            <Reel symbol={reels[0]} spinning={spinning} delay={0} />
            <Reel symbol={reels[1]} spinning={spinning} delay={200} />
            <Reel symbol={reels[2]} spinning={spinning} delay={400} />
          </div>

          {/* Win Line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
            <div className="flex-1 h-px bg-gradient-to-r from-amber-400/50 via-amber-400/20 to-amber-400/50" />
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
          </div>
        </div>

        {/* Win Display */}
        <AnimatePresence>
          {lastWin && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-6"
            >
              <div className={`inline-block px-6 py-3 rounded-xl ${
                lastWin.multiplier >= 10 
                  ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/30' 
                  : 'bg-green-500/20 border border-green-500/30'
              }`}>
                <p className={`font-bold text-lg ${lastWin.multiplier >= 10 ? 'text-amber-400' : 'text-green-400'}`}>
                  {lastWin.name}
                </p>
                <p className={`text-2xl font-black ${lastWin.multiplier >= 10 ? 'text-amber-300' : 'text-green-300'}`}>
                  +{Math.floor(betAmount * lastWin.multiplier)} points
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet Selection */}
        <div className="mb-6">
          <p className="text-slate-400 text-sm mb-3 text-center">Bet Amount</p>
          <div className="flex flex-wrap justify-center gap-2">
            {betOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => !spinning && setBetAmount(amount)}
                disabled={spinning || amount > balance}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  betAmount === amount
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                    : amount > balance
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <Button
          onClick={spin}
          disabled={spinning || disabled || balance < betAmount}
          className="w-full h-16 text-xl font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-50 disabled:shadow-none"
        >
          {spinning ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            `SPIN - ${betAmount} pts`
          )}
        </Button>

        {/* Paytable */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-500 text-xs text-center mb-3">PAYTABLE</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>7️⃣7️⃣7️⃣</span>
              <span className="text-amber-400">50x</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>💎💎💎</span>
              <span className="text-amber-400">25x</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>⭐⭐⭐</span>
              <span className="text-amber-400">20x</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>🍇🍇🍇</span>
              <span className="text-amber-400">10x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
