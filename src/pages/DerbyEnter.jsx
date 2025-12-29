import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function DerbyEnter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const horseId = urlParams.get('horse');

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

  const { data: horse } = useQuery({
    queryKey: ['horse', horseId],
    queryFn: async () => {
      const horses = await base44.entities.RaceHorse.filter({ id: horseId });
      return horses[0] || null;
    },
    enabled: !!horseId,
  });

  const { data: openRaces = [] } = useQuery({
    queryKey: ['openRaces'],
    queryFn: () => base44.entities.RaceEvent.filter({ status: 'open' }),
  });

  const enterRaceMutation = useMutation({
    mutationFn: async (raceId) => {
      const races = await base44.entities.RaceEvent.filter({ id: raceId });
      const race = races[0];

      if (race.status !== 'open') throw new Error('Race not open');
      
      const entries = await base44.entities.RaceEntry.filter({ race_id: raceId });
      if (entries.length >= race.max_horses) throw new Error('Race full');
      if (entries.some(e => e.horse_id === horseId)) throw new Error('Already entered');

      if (player.points_balance < race.entry_fee) throw new Error('Insufficient balance');

      const laneNumber = entries.length + 1;

      await base44.entities.RaceEntry.create({
        race_id: raceId,
        horse_id: horseId,
        owner_id: player.id,
        entry_fee_paid: race.entry_fee,
        lane_number: laneNumber,
      });

      await base44.entities.Player.update(player.id, {
        points_balance: player.points_balance - race.entry_fee,
      });

      await base44.entities.Ledger.create({
        player_id: player.id,
        change: -race.entry_fee,
        reason: 'game_bet',
        balance_after: player.points_balance - race.entry_fee,
        note: `Entry fee for race ${race.id.slice(0, 6)}`,
      });

      // Update race purse
      await base44.entities.RaceEvent.update(raceId, {
        total_owner_purse: race.total_owner_purse + race.entry_fee,
        entered_horses: [...(race.entered_horses || []), horseId],
      });
    },
    onSuccess: (_, raceId) => {
      queryClient.invalidateQueries({ queryKey: ['openRaces'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast.success('Entered race!');
      navigate(createPageUrl('DerbyRace') + `?id=${raceId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enter race');
    },
  });

  if (!horse || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('DerbyStable'))}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stable
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl">
              {horse.avatar_emoji}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{horse.horse_name}</h1>
              <p className="text-slate-400">Select a race to enter</p>
            </div>
          </div>
        </motion.div>

        {openRaces.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-8 text-center">
              <p className="text-slate-400">No open races available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {openRaces.map((race) => (
              <Card key={race.id} className="bg-slate-900/50 border-slate-700/50 hover:border-amber-500/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-2">
                        Race #{race.race_number || race.id.slice(0, 6)}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Type</p>
                          <p className="text-white font-semibold">
                            {race.race_type === 'duel' ? '⚔️ Duel' : race.race_type === 'sprint' ? '🏃 Sprint' : '🏆 Main'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Entry Fee</p>
                          <p className="text-amber-400 font-bold">{race.entry_fee.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Purse</p>
                          <p className="text-green-400 font-bold">{race.total_owner_purse.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Starts</p>
                          <p className="text-white font-semibold">{moment(race.starts_at).fromNow()}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => enterRaceMutation.mutate(race.id)}
                      disabled={enterRaceMutation.isPending || player.points_balance < race.entry_fee}
                      className="ml-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    >
                      {enterRaceMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Enter Race'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}