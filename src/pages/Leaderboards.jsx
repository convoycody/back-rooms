import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, ArrowLeft, TrendingUp, Star, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import VIPBadge from '@/components/VIPBadge';

export default function Leaderboards() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const categories = [
    { 
      key: 'balance', 
      label: 'Total Balance', 
      icon: TrendingUp,
      sort: (a, b) => (b.points_balance || 0) - (a.points_balance || 0),
      getValue: (p) => `${(p.points_balance || 0).toLocaleString()} pts`
    },
    { 
      key: 'level', 
      label: 'Highest Level', 
      icon: Star,
      sort: (a, b) => (b.level || 1) - (a.level || 1),
      getValue: (p) => `Level ${p.level || 1}`
    },
    { 
      key: 'wagered', 
      label: 'Total Wagered', 
      icon: Target,
      sort: (a, b) => (b.total_wagered || 0) - (a.total_wagered || 0),
      getValue: (p) => `${(p.total_wagered || 0).toLocaleString()} pts`
    },
    { 
      key: 'won', 
      label: 'Total Won', 
      icon: Trophy,
      sort: (a, b) => (b.total_won || 0) - (a.total_won || 0),
      getValue: (p) => `${(p.total_won || 0).toLocaleString()} pts`
    }
  ];

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/30';
    return 'bg-slate-900/30 border-slate-700/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            🏆 Leaderboards
          </h1>
          <p className="text-slate-400 mt-2">Compete with the best players</p>
        </div>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1 mb-6">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.key} 
                value={cat.key}
                className="data-[state=active]:bg-slate-800"
              >
                <cat.icon className="w-4 h-4 mr-2" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => {
            const sortedPlayers = [...players].sort(category.sort).slice(0, 50);
            
            return (
              <TabsContent key={category.key} value={category.key}>
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <category.icon className="w-5 h-5 text-amber-400" />
                      Top 50 - {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sortedPlayers.map((player, idx) => {
                        const rank = idx + 1;
                        return (
                          <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={`flex items-center gap-4 p-4 rounded-lg border ${getRankStyle(rank)}`}
                          >
                            <div className="text-2xl font-black w-12 text-center">
                              {getRankIcon(rank)}
                            </div>

                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                              {player.avatar_url ? (
                                <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                player.display_name?.[0]?.toUpperCase() || '?'
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{player.display_name}</span>
                                {player.vip_tier > 0 && <VIPBadge tier={player.vip_tier} size="sm" />}
                              </div>
                              <span className="text-slate-400 text-sm">Level {player.level || 1}</span>
                            </div>

                            <div className="text-right">
                              <div className="text-white font-bold">
                                {category.getValue(player)}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}