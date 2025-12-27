import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Medal, Crown, TrendingUp, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const RankIcon = ({ rank }) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-slate-400 font-bold">{rank}</span>;
};

const RankStyle = (rank) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
  if (rank === 2) return 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/50';
  if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
  return 'bg-slate-800/50 border-slate-700/50';
};

export default function EnhancedLeaderboard({ currentPlayerId }) {
  const [category, setCategory] = useState('total_won');

  const { data: players = [] } = useQuery({
    queryKey: ['leaderboardPlayers'],
    queryFn: () => base44.entities.Player.list('-total_won', 100),
  });

  const getSortedPlayers = () => {
    const sorted = [...players];
    
    switch (category) {
      case 'total_won':
        return sorted.sort((a, b) => (b.total_won || 0) - (a.total_won || 0));
      case 'total_wagered':
        return sorted.sort((a, b) => (b.total_wagered || 0) - (a.total_wagered || 0));
      case 'level':
        return sorted.sort((a, b) => (b.level || 1) - (a.level || 1));
      case 'blackjack_streak':
        return sorted.sort((a, b) => (b.blackjack_longest_streak || 0) - (a.blackjack_longest_streak || 0));
      case 'slots_avg_bet':
        return sorted.sort((a, b) => {
          const avgA = (a.slots_games_played || 0) > 0 ? (a.slots_total_bet || 0) / a.slots_games_played : 0;
          const avgB = (b.slots_games_played || 0) > 0 ? (b.slots_total_bet || 0) / b.slots_games_played : 0;
          return avgB - avgA;
        });
      case 'plinko_drops':
        return sorted.sort((a, b) => (b.plinko_drops || 0) - (a.plinko_drops || 0));
      default:
        return sorted;
    }
  };

  const sortedPlayers = getSortedPlayers().slice(0, 10);

  const getValue = (player) => {
    switch (category) {
      case 'total_won':
        return (player.total_won || 0).toLocaleString();
      case 'total_wagered':
        return (player.total_wagered || 0).toLocaleString();
      case 'level':
        return player.level || 1;
      case 'blackjack_streak':
        return player.blackjack_longest_streak || 0;
      case 'slots_avg_bet':
        return player.slots_games_played > 0 
          ? Math.round((player.slots_total_bet || 0) / player.slots_games_played)
          : 0;
      case 'plinko_drops':
        return player.plinko_drops || 0;
      default:
        return '-';
    }
  };

  const getLabel = () => {
    switch (category) {
      case 'total_won': return 'Total Won';
      case 'total_wagered': return 'Wagered';
      case 'level': return 'Level';
      case 'blackjack_streak': return 'Streak';
      case 'slots_avg_bet': return 'Avg Bet';
      case 'plinko_drops': return 'Drops';
      default: return '';
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="grid grid-cols-3 gap-1 bg-slate-800/50 p-1 mb-4">
            <TabsTrigger value="total_won" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Won
            </TabsTrigger>
            <TabsTrigger value="level" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Level
            </TabsTrigger>
            <TabsTrigger value="blackjack_streak" className="text-xs">
              🔥 Streak
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid grid-cols-3 gap-1 bg-slate-800/50 p-1 mb-4">
            <TabsTrigger value="slots_avg_bet" className="text-xs">
              🎰 Avg
            </TabsTrigger>
            <TabsTrigger value="plinko_drops" className="text-xs">
              ⚪ Drops
            </TabsTrigger>
            <TabsTrigger value="total_wagered" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Bet
            </TabsTrigger>
          </TabsList>

          <div className="space-y-2">
            {sortedPlayers.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">No players yet</p>
            ) : (
              sortedPlayers.map((player, index) => (
                <Link key={player.id} to={createPageUrl('PlayerProfile') + `?id=${player.id}`}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer ${RankStyle(index + 1)} ${
                      player.id === currentPlayerId ? 'ring-2 ring-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center w-8">
                      <RankIcon rank={index + 1} />
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm flex-shrink-0">
                      {player.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {player.display_name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        Level {player.level || 1}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-amber-400 font-bold text-sm">
                        {getValue(player)}
                      </p>
                      <p className="text-slate-500 text-xs">{getLabel()}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}