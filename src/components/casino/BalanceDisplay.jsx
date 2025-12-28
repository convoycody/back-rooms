import React from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import VIPBadge from '@/components/VIPBadge';

export default function BalanceDisplay({ balance, lastChange, vipTier, xp }) {
  const VIP_TIERS = [
    { tier: 0, name: 'Player', threshold: 0 },
    { tier: 1, name: 'Regular', threshold: 5000 },
    { tier: 2, name: 'Insider', threshold: 15000 },
    { tier: 3, name: 'High Roller', threshold: 40000 },
    { tier: 4, name: 'Elite', threshold: 100000 },
    { tier: 5, name: 'Legend', threshold: 250000 }
  ];

  const currentTier = VIP_TIERS[vipTier || 0];
  const nextTier = (vipTier || 0) < 5 ? VIP_TIERS[(vipTier || 0) + 1] : null;
  const vipProgress = nextTier 
    ? (((xp || 0) - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
    : 100;

  return (
    <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Balance */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Coins className="w-6 h-6 text-black" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Balance</p>
            <div className="flex items-center gap-2">
              <motion.span
                key={balance}
                initial={{ scale: 1.2, color: '#fbbf24' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="text-xl sm:text-2xl lg:text-3xl font-black text-white break-all"
              >
                {typeof balance === 'number' ? balance.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
              </motion.span>
              {lastChange !== 0 && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-sm font-semibold flex items-center ${
                    lastChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {lastChange > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {lastChange > 0 ? '+' : ''}{lastChange}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* VIP Badge & Progress */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <VIPBadge tier={vipTier || 0} size="md" showName />
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${vipProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {(xp || 0).toLocaleString()} XP
              {nextTier && ` / ${nextTier.threshold.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}