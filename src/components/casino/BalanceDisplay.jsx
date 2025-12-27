import React from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export default function BalanceDisplay({ balance, lastChange, level, xp }) {
  const xpForNextLevel = level * 500;
  const xpProgress = (xp % 500) / 500 * 100;

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
                className="text-2xl sm:text-3xl font-black text-white"
              >
                {balance.toLocaleString()}
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

        {/* Level & XP */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-bold">Level {level}</span>
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">{xp % 500}/{500} XP</p>
          </div>
        </div>
      </div>
    </div>
  );
}