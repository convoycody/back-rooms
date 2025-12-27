import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Dices, CircleDot } from 'lucide-react';
import moment from 'moment';

const getGameIcon = (type) => {
  switch (type) {
    case 'slots':
      return '🎰';
    case 'blackjack':
      return '🃏';
    case 'dice':
      return '🎲';
    default:
      return '🎮';
  }
};

export default function RecentGames({ sessions }) {
  const recentSessions = sessions.slice(0, 10);

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Recent Games</h3>
          <p className="text-slate-400 text-sm">Your latest activity</p>
        </div>
      </div>

      <div className="space-y-2">
        {recentSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30"
          >
            <div className="text-2xl">{getGameIcon(session.game_type)}</div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white capitalize">
                {session.game_type}
              </p>
              <p className="text-slate-500 text-xs">
                Bet: {session.bet_amount} pts
              </p>
            </div>
            
            <div className="text-right">
              <p className={`font-bold ${
                session.points_delta > 0 
                  ? 'text-green-400' 
                  : session.points_delta === 0 
                  ? 'text-amber-400' 
                  : 'text-red-400'
              }`}>
                {session.points_delta > 0 ? '+' : ''}{session.points_delta}
              </p>
              <p className="text-slate-500 text-xs">
                {moment(session.created_date).fromNow()}
              </p>
            </div>
          </motion.div>
        ))}

        {recentSessions.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Dices className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No games played yet</p>
            <p className="text-sm">Start playing to see your history!</p>
          </div>
        )}
      </div>
    </div>
  );
}