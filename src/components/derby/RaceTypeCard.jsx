import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function RaceTypeCard({ type, entryFee, maxHorses, description, emoji }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={`bg-gradient-to-br ${
        type === 'duel' ? 'from-red-900/30 to-orange-900/30 border-red-700/50' :
        type === 'sprint' ? 'from-blue-900/30 to-cyan-900/30 border-blue-700/50' :
        'from-purple-900/30 to-pink-900/30 border-purple-700/50'
      }`}>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <span className="text-5xl block mb-3">{emoji}</span>
            <h3 className="text-2xl font-black text-white mb-1">{type.toUpperCase()}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Horses</span>
              <span className="text-white font-semibold">{maxHorses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Entry Fee</span>
              <span className="text-amber-400 font-bold">{entryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Base Purse</span>
              <span className="text-green-400 font-bold">{(entryFee * maxHorses).toLocaleString()}</span>
            </div>
          </div>

          {type === 'main' && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 text-center">
              <p className="text-amber-400 text-xs font-semibold">
                🏆 FEATURED EVENT • High Stakes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}