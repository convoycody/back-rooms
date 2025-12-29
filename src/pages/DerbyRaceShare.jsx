import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Trophy, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function DerbyRaceShare() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const shareSlug = urlParams.get('slug');

  const { data: race, isLoading } = useQuery({
    queryKey: ['sharedRace', shareSlug],
    queryFn: async () => {
      const races = await base44.entities.RaceEvent.filter({ id: shareSlug });
      return races[0] || null;
    },
    enabled: !!shareSlug,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['sharedRaceEntries', shareSlug],
    queryFn: () => base44.entities.RaceEntry.filter({ race_id: shareSlug }),
    enabled: !!shareSlug,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['sharedRaceHorses', entries],
    queryFn: async () => {
      if (entries.length === 0) return [];
      const horseIds = entries.map(e => e.horse_id);
      const allHorses = await Promise.all(
        horseIds.map(id => base44.entities.RaceHorse.filter({ id }))
      );
      return allHorses.flat();
    },
    enabled: entries.length > 0,
  });

  if (isLoading || !race) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const winner = entries.find(e => e.final_position === 1);
  const winnerHorse = winner ? horses.find(h => h.id === winner.horse_id) : null;

  const getRaceTypeLabel = (type) => {
    if (type === 'duel') return '⚔️ 2-Horse Duel';
    if (type === 'sprint') return '🏃 4-Horse Sprint';
    return '🏆 6-Horse Main Event';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-amber-500/20 rounded-full">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">Shared Race Result</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Race #{race.race_number || race.id.slice(0, 6)}
          </h1>
          <p className="text-slate-400">{getRaceTypeLabel(race.race_type)}</p>
        </motion.div>

        {race.status === 'completed' && winnerHorse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 border-amber-500/50">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-2">Winner!</h2>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-5xl">{winnerHorse.avatar_emoji}</span>
                  <div>
                    <p className="text-2xl font-bold text-white">{winnerHorse.horse_name}</p>
                    <p className="text-amber-400 text-sm">First Place</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 inline-block">
                  <p className="text-slate-400 text-sm">Purse Winnings</p>
                  <p className="text-3xl font-black text-amber-400">{winner.payout.toLocaleString()}</p>
                  <p className="text-slate-400 text-xs">points</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Final Positions */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Final Results</h3>
            <div className="space-y-3">
              {entries
                .filter(e => e.final_position)
                .sort((a, b) => a.final_position - b.final_position)
                .map((entry) => {
                  const horse = horses.find(h => h.id === entry.horse_id);
                  if (!horse) return null;

                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          entry.final_position === 1 ? 'bg-amber-500 text-black' :
                          entry.final_position === 2 ? 'bg-slate-400 text-black' :
                          'bg-orange-700 text-white'
                        }`}>
                          {entry.final_position}
                        </div>
                        <span className="text-3xl">{horse.avatar_emoji}</span>
                        <div>
                          <p className="text-white font-bold">{horse.horse_name}</p>
                          <p className="text-slate-400 text-sm">Lane {entry.lane_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-bold">+{entry.payout.toLocaleString()}</p>
                        <p className="text-slate-500 text-xs">purse</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Race Stats */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Race Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Total Purse</p>
                <p className="text-white font-bold">{race.total_owner_purse.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Bets</p>
                <p className="text-white font-bold">
                  {(race.total_win_pool + race.total_place_pool + race.total_show_pool).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-white font-bold">{moment(race.completed_at).format('MMM D, h:mm A')}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Participants</p>
                <p className="text-white font-bold">{entries.length} horses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-400 mb-4">Want to race your own horse?</p>
          <Button
            onClick={() => navigate(createPageUrl('DerbyLobby'))}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            Enter the Derby
          </Button>
        </div>
      </div>
    </div>
  );
}