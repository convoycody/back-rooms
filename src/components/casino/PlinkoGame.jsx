import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PAYOUT_TABLES = {
  low: [1.5, 1.4, 1.3, 1.2, 1.1, 1.2, 1.3, 1.4, 1.5],
  medium: [3, 2, 1.5, 1, 0.5, 1, 1.5, 2, 3],
  high: [10, 5, 2, 0.5, 0.2, 0.5, 2, 5, 10]
};

const PlinkoBoard = ({ rows = 12, path = [], dropping = false, finalBucket = null, riskMode = 'medium' }) => {
  const [animatedPath, setAnimatedPath] = useState([]);
  const bucketCount = 9;

  useEffect(() => {
    if (dropping && path.length > 0) {
      setAnimatedPath([]);
      path.forEach((_, idx) => {
        setTimeout(() => {
          setAnimatedPath(prev => [...prev, path[idx]]);
        }, idx * 80);
      });
    }
  }, [dropping, path]);

  const getBallPosition = () => {
    if (!dropping || animatedPath.length === 0) return null;
    
    let x = 50; // Start center
    animatedPath.forEach(dir => {
      x += dir === 'R' ? 5 : -5;
    });
    
    const y = (animatedPath.length / rows) * 100;
    return { x, y };
  };

  const ballPos = getBallPosition();

  return (
    <div className="relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700 overflow-hidden" style={{ height: '500px' }}>
      {/* Pegs */}
      <div className="absolute inset-0 flex flex-col justify-around py-8">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-8">
            {Array.from({ length: rowIdx + 3 }).map((_, pegIdx) => (
              <div 
                key={pegIdx} 
                className="w-2 h-2 rounded-full bg-slate-600"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Ball */}
      <AnimatePresence>
        {ballPos && (
          <motion.div
            key="ball"
            className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/50 z-10"
            initial={{ left: '50%', top: '0%', scale: 0 }}
            animate={{ 
              left: `${ballPos.x}%`, 
              top: `${ballPos.y}%`,
              scale: 1
            }}
            exit={{ scale: 0 }}
            transition={{ 
              duration: 0.08,
              ease: 'linear'
            }}
          />
        )}
      </AnimatePresence>

      {/* Buckets */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 px-4">
        {Array.from({ length: bucketCount }).map((_, idx) => {
          const multipliers = PAYOUT_TABLES[riskMode] || PAYOUT_TABLES.medium;
          const mult = multipliers[idx];
          const isActive = finalBucket === idx;
          const isHigh = mult >= 3;
          
          return (
            <div 
              key={idx} 
              className={`flex-1 h-16 rounded-t-xl border-2 flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-amber-500/30 border-amber-400 shadow-lg shadow-amber-500/50 scale-110' 
                  : isHigh 
                  ? 'bg-purple-500/10 border-purple-500/30' 
                  : 'bg-slate-700/30 border-slate-600'
              }`}
            >
              <span className={`text-xs font-bold ${
                isActive 
                  ? 'text-amber-300' 
                  : isHigh 
                  ? 'text-purple-300' 
                  : 'text-slate-400'
              }`}>
                {mult}x
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecentDrops = ({ drops = [] }) => (
  <div className="mt-4 space-y-2">
    <p className="text-slate-400 text-sm font-semibold">Recent Drops</p>
    <div className="space-y-1">
      {drops.slice(0, 10).map((drop, idx) => (
        <div 
          key={idx} 
          className="flex items-center justify-between text-xs bg-slate-800/50 rounded-lg px-3 py-2"
        >
          <span className="text-slate-400">Bucket {drop.bucket_index}</span>
          <Badge variant={drop.net_result > 0 ? 'default' : 'secondary'} className="text-xs">
            {drop.multiplier}x
          </Badge>
          <span className={drop.net_result > 0 ? 'text-green-400' : 'text-red-400'}>
            {drop.net_result > 0 ? '+' : ''}{drop.net_result}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default function PlinkoGame({ balance, onDropComplete, houseConfig }) {
  const [betAmount, setBetAmount] = useState(10);
  const [riskMode, setRiskMode] = useState('medium');
  const [dropping, setDropping] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [recentDrops, setRecentDrops] = useState([]);
  const [clientSeed, setClientSeed] = useState(Math.random().toString(36).substring(7));
  const [animatingPath, setAnimatingPath] = useState([]);
  const [finalBucket, setFinalBucket] = useState(null);

  const rows = houseConfig?.plinko_rows || 12;
  const minBet = houseConfig?.plinko_min_bet || 1;
  const maxBet = houseConfig?.plinko_max_bet || 1000;

  const drop = async () => {
    if (dropping || balance < betAmount) return;
    if (!houseConfig?.plinko_enabled) {
      alert('Plinko is currently disabled');
      return;
    }

    const seedToUse = clientSeed;

    setDropping(true);
    setLastResult(null);
    setFinalBucket(null);
    setAnimatingPath([]);

    try {
      const response = await base44.functions.invoke('dropPlinko', {
        bet_amount: betAmount,
        risk_mode: riskMode,
        rows: rows,
        client_seed: seedToUse
      });

      const result = response.data;

      // Animate the drop
      setAnimatingPath(result.path);
      
      setTimeout(() => {
        setFinalBucket(result.bucket_index);
        setLastResult(result);
        setRecentDrops(prev => [result, ...prev].slice(0, 10));
        onDropComplete(result);
        setDropping(false);
        
        // Generate new client seed
        setClientSeed(Math.random().toString(36).substring(7));
      }, result.path.length * 80 + 500);

    } catch (error) {
      console.error('Drop error:', error);
      alert(error.response?.data?.error || 'Drop failed');
      setDropping(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 border border-orange-500/20 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
            PLINKO
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">Drop the ball • Choose your risk</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Info className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">How to Play Plinko</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-slate-300">
              <p>Drop a ball down the peg board and watch it bounce to one of 9 buckets at the bottom. Each bucket has a multiplier!</p>
              
              <div>
                <h3 className="font-bold text-white mb-2">Risk Modes</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li><span className="text-green-400">Low Risk</span>: Safe bets, consistent small wins (1.1x - 1.5x)</li>
                  <li><span className="text-amber-400">Medium Risk</span>: Balanced risk/reward (0.5x - 3x)</li>
                  <li><span className="text-red-400">High Risk</span>: Extreme volatility (0.2x - 10x)</li>
                </ul>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="font-bold text-white mb-2">Provably Fair</h3>
                <p className="text-slate-400 text-xs">
                  Each drop uses your client seed + server seed + nonce. The ball path is deterministic and verifiable.
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Client Seed: <code className="bg-slate-800 px-1 rounded">{clientSeed}</code>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plinko Board */}
      <PlinkoBoard 
        rows={rows} 
        path={animatingPath} 
        dropping={dropping}
        finalBucket={finalBucket}
        riskMode={riskMode}
      />

      {/* Result Display */}
      <AnimatePresence>
        {lastResult && !dropping && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <Card className={`${
              lastResult.net_result > 0
                ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border-green-400/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-slate-300 mb-1">Landed in bucket {lastResult?.bucket_index ?? 0}</p>
                <p className={`text-3xl font-black ${lastResult.net_result > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {lastResult?.multiplier ?? 0}x • {lastResult.net_result > 0 ? '+' : ''}{lastResult?.net_result ?? 0} points
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="mt-6 space-y-6">
        {/* Risk Mode */}
        <div>
          <p className="text-slate-400 text-sm mb-3">Risk Level</p>
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map((mode) => (
              <button
                key={mode}
                onClick={() => !dropping && setRiskMode(mode)}
                disabled={dropping}
                className={`py-3 rounded-xl font-bold transition-all capitalize ${
                  riskMode === mode
                    ? mode === 'low'
                      ? 'bg-green-500 text-black shadow-lg shadow-green-500/30'
                      : mode === 'medium'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                      : 'bg-red-500 text-black shadow-lg shadow-red-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Amount */}
        <div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-400">Bet Amount</span>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || minBet;
                if (!dropping && val >= minBet && val <= maxBet) {
                  setBetAmount(val);
                }
              }}
              disabled={dropping}
              className="w-24 px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-white font-bold text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
              min={minBet}
              max={maxBet}
            />
          </div>
          <div className="flex gap-2 mb-3">
            {[1, 5, 10, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => !dropping && setBetAmount(Math.min(betAmount + amount, maxBet, balance))}
                disabled={dropping}
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-105"
              >
                +{amount}
              </button>
            ))}
            <button
              onClick={() => !dropping && setBetAmount(minBet)}
              disabled={dropping}
              className="px-3 py-2 rounded-lg font-bold text-sm transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 hover:scale-105"
            >
              CLR
            </button>
            {houseConfig?.max_bet_button_enabled && (
              <button
                onClick={() => !dropping && setBetAmount(Math.min(balance, maxBet))}
                disabled={dropping}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-all bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30 hover:scale-105"
              >
                MAX
              </button>
            )}
          </div>
          <div className="relative">
            <Slider
              value={[betAmount]}
              onValueChange={([val]) => !dropping && setBetAmount(val)}
              min={minBet}
              max={maxBet}
              step={1}
              disabled={dropping}
              className="cursor-pointer [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-2 [&_[role=slider]]:border-orange-300 [&_[role=slider]]:shadow-lg"
            />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>{minBet}</span>
              <span>{maxBet}</span>
            </div>
          </div>
        </div>

        {/* Drop Button */}
        <Button
          onClick={drop}
          disabled={dropping || balance < betAmount || !houseConfig?.plinko_enabled}
          className="w-full h-14 text-xl font-black bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:via-amber-400 hover:to-orange-400 text-black rounded-xl shadow-lg shadow-orange-500/30 disabled:opacity-50"
        >
          {dropping ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            `DROP - ${betAmount} pts`
          )}
        </Button>

        {balance < betAmount && (
          <p className="text-red-400 text-sm text-center">Insufficient balance</p>
        )}
      </div>

      {/* Recent Drops */}
      {recentDrops.length > 0 && (
        <RecentDrops drops={recentDrops} />
      )}
    </div>
  );
}