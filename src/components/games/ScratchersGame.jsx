import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

export default function ScratchersGame({ balance, onGameEnd }) {
  const [scratching, setScratching] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const COST = 1000;

  const handleScratch = async () => {
    if (balance < COST || scratching) return;

    setScratching(true);
    setRevealed(false);
    setResult(null);

    try {
      const clientSeed = Math.random().toString(36).substring(7);
      const response = await base44.functions.invoke('playScratchCard', { client_seed: clientSeed });

      if (response.data.success) {
        setResult(response.data.result);
        
        // Animate reveal after a delay
        setTimeout(() => {
          setRevealed(true);
          
          if (response.data.result.prize > 0) {
            confetti({
              particleCount: response.data.result.is_rare ? 200 : 100,
              spread: response.data.result.is_rare ? 180 : 90,
              origin: { y: 0.6 }
            });
          }

          onGameEnd?.({
            bet: COST,
            payout: response.data.result.prize,
            net: response.data.result.prize - COST,
            symbols: response.data.result.symbols,
            is_rare: response.data.result.is_rare
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Scratch error:', error);
      alert(error.response?.data?.error || 'Failed to scratch card');
    } finally {
      setScratching(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/20 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-2">
          🎫 SCRATCHERS
        </h2>
        <p className="text-slate-400 text-sm">Match 3 symbols to win!</p>
      </div>

      {/* Scratch Card */}
      <div className="mb-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="unscratched"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <Card className="bg-gradient-to-br from-amber-600 to-yellow-600 border-amber-500/30 h-80 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
                <CardContent className="flex items-center justify-center h-full relative z-10">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                    <p className="text-white text-2xl font-black">SCRATCH TO WIN!</p>
                    <p className="text-amber-100 text-sm mt-2">Win up to 2,000,000 points</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="scratched"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <Card className={`border-2 h-80 relative overflow-hidden ${
                result.prize > 0 
                  ? result.is_rare 
                    ? 'bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-purple-500'
                    : 'bg-gradient-to-br from-green-900/90 to-emerald-900/90 border-green-500'
                  : 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700'
              }`}>
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: revealed ? 1 : 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-4 mb-6">
                      {result.symbols.map((symbol, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.2 }}
                          className="text-7xl"
                        >
                          {symbol}
                        </motion.div>
                      ))}
                    </div>
                    
                    {result.prize > 0 ? (
                      <>
                        {result.is_rare && (
                          <p className="text-purple-300 font-black text-2xl mb-2 animate-pulse">
                            🌟 RARE PRIZE! 🌟
                          </p>
                        )}
                        <p className="text-white font-black text-5xl mb-2">
                          +{result.prize.toLocaleString()}
                        </p>
                        <p className="text-green-400 text-xl">WINNER!</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-400 text-3xl mb-2">Try Again</p>
                        <p className="text-slate-500 text-sm">Better luck next time!</p>
                      </>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prize Table */}
      <div className="mb-6 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400 text-sm font-bold mb-2">PRIZE TABLE</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🍒🍒🍒</span>
            <span className="text-white">100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🍋🍋🍋</span>
            <span className="text-white">250</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🍇🍇🍇</span>
            <span className="text-white">5,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">💎💎💎</span>
            <span className="text-white">10,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">7️⃣7️⃣7️⃣</span>
            <span className="text-white">100,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">⭐⭐⭐</span>
            <span className="text-white">250,000</span>
          </div>
          <div className="flex items-center justify-between col-span-2">
            <span className="text-purple-400 font-bold">👑👑👑 RARE</span>
            <span className="text-purple-400 font-bold">500,000+</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleScratch}
        disabled={scratching || balance < COST || (result && !revealed)}
        className="w-full h-14 text-xl font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl shadow-lg"
      >
        {scratching || (result && !revealed) ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Scratching...
          </>
        ) : (
          `SCRATCH - ${COST.toLocaleString()} pts`
        )}
      </Button>

      {balance < COST && (
        <p className="text-red-400 text-sm text-center mt-2">Insufficient balance</p>
      )}
    </div>
  );
}