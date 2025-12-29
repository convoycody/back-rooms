import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Trophy, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function DerbyLobby() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: config } = useQuery({
    queryKey: ['raceConfig'],
    queryFn: async () => {
      const configs = await base44.entities.RaceConfig.list();
      return configs[0];
    },
  });

  const { data: openRaces = [], isLoading } = useQuery({
    queryKey: ['openRaces'],
    queryFn: () => base44.entities.RaceEvent.filter({ status: 'open' }, '-created_date'),
    refetchInterval: 5000,
  });

  const { data: ownerLicense } = useQuery({
    queryKey: ['ownerLicense', player?.id],
    queryFn: async () => {
      if (!player) return null;
      const licenses = await base44.entities.OwnerLicense.filter({ player_id: player.id });
      return licenses[0] || null;
    },
    enabled: !!player,
  });

  const filteredRaces = activeTab === 'all' ? openRaces : openRaces.filter(r => r.race_type === activeTab);

  const getRaceTypeEmoji = (type) => {
    if (type === 'duel') return '⚔️';
    if (type === 'sprint') return '🏃';
    return '🏆';
  };

  const getRaceTypeLabel = (type) => {
    if (type === 'duel') return '2-Horse Duel';
    if (type === 'sprint') return '4-Horse Sprint';
    return '6-Horse Main Event';
  };

  if (!currentUser || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!config?.derby_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Derby Closed</h2>
            <p className="text-slate-400">The racetrack is currently offline</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent mb-3">
            🏇 Backroom Derby
          </h1>
          <p className="text-slate-400">Enter races as an owner or bet as a spectator</p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Owner Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">
                    👑
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Horse Owner</h3>
                    <p className="text-slate-400 text-sm">Race your horses for purse money</p>
                  </div>
                </div>
                {ownerLicense ? (
                  <div className="space-y-2">
                    <p className="text-green-400 text-sm">✓ Licensed Owner</p>
                    <p className="text-slate-400 text-xs">Wins: {ownerLicense.total_wins} • Earnings: {ownerLicense.total_earnings.toLocaleString()} pts</p>
                    <Button
                      onClick={() => navigate(createPageUrl('DerbyStable'))}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      My Stable
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm">License Cost: {config?.owner_license_cost?.toLocaleString()} pts</p>
                    <Button
                      onClick={() => navigate(createPageUrl('DerbyStable'))}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={player.points_balance < (config?.owner_license_cost || 50000)}
                    >
                      Get Owner License
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Spectator Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">
                    🎟️
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Spectator</h3>
                    <p className="text-slate-400 text-sm">Bet on races, win big</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Watch races and place Win/Place/Show bets
                </p>
                <p className="text-blue-400 text-xs">Browse open races below to get started</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Race Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 mb-6">
                  <TabsTrigger value="all" className="flex-1">All Races</TabsTrigger>
                  <TabsTrigger value="duel" className="flex-1">⚔️ Duels</TabsTrigger>
                  <TabsTrigger value="sprint" className="flex-1">🏃 Sprints</TabsTrigger>
                  <TabsTrigger value="main" className="flex-1">🏆 Main Events</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                  ) : filteredRaces.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No open races right now</p>
                      <p className="text-slate-500 text-sm mt-2">Check back soon!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRaces.map((race) => (
                        <Card key={race.id} className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl">{getRaceTypeEmoji(race.race_type)}</span>
                                  <div>
                                    <h3 className="text-white font-bold">Race #{race.race_number || race.id.slice(0, 6)}</h3>
                                    <p className="text-slate-400 text-sm">{getRaceTypeLabel(race.race_type)}</p>
                                  </div>
                                </div>
                                <div className="flex gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Users className="w-4 h-4" />
                                    <span>{race.entered_horses?.length || 0}/{race.max_horses}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Trophy className="w-4 h-4" />
                                    <span>{race.total_owner_purse.toLocaleString()} pts</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{moment(race.starts_at).fromNow()}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => navigate(createPageUrl('DerbyRace') + `?id=${race.id}`)}
                                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                              >
                                View Race
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}