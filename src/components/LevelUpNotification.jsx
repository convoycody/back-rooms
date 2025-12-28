import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';

export default function LevelUpNotification({ tier, bonus, tier_name, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-2xl p-1 shadow-2xl shadow-amber-500/50">
            <div className="bg-slate-900 rounded-xl px-8 py-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                <Trophy className="w-8 h-8 text-yellow-400" />
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-amber-400 font-black text-3xl mb-1">VIP TIER UP!</p>
                <p className="text-white text-xl font-bold">{tier_name || `Tier ${tier}`}</p>
                {bonus > 0 && (
                  <p className="text-green-400 text-lg font-semibold mt-2">
                    +{bonus.toLocaleString()} bonus points!
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}