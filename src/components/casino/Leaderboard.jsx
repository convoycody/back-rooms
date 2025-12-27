import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-slate-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-slate-500 font-bold text-sm">{rank}</span>;
  }
};

const getRankStyle = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-amber-500/30';
    case 2:
      return 'bg-gradient-to-r from-slate-400/10 via-slate-300/10 to-slate-400/10 border-slate-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-700/10 via-orange-600/10 to-amber-700/10 border-amber-700/30';
    default:
      return 'bg-slate-800/50 border-slate-700/30';
  }
};

export default function Leaderboard({ players, currentPlayerId }) {
  const sortedPlayers = [...players]
    .sort((a, b) => b.total_won - a.total_won)
    .slice(0, 10);

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Leaderboard</h3>
          <p className="text-slate-400 text-sm">Top players by winnings</p>
        </div>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${getRankStyle(index + 1)} ${
              player.id === currentPlayerId ? 'ring-2 ring-cyan-500/50' : ''
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {getRankIcon(index + 1)}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg">
              {player.display_name?.[0]?.toUpperCase() || '?'}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {player.display_name}
                {player.id === currentPlayerId && (
                  <span className="ml-2 text-cyan-400 text-xs">(You)</span>
                )}
              </p>
              <p className="text-slate-400 text-xs">Level {player.level || 1}</p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-amber-400">
                {(player.total_won || 0).toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                {player.games_played || 0} games
              </p>
            </div>
          </motion.div>
        ))}

        {sortedPlayers.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No players yet</p>
            <p className="text-sm">Be the first to play!</p>
          </div>
        )}
      </div>
    </div>
  );
}