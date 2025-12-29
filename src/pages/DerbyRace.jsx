import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';
import BettingSlip from '@/components/derby/BettingSlip';
import OddsDisplay from '@/components/derby/OddsDisplay';
import MomentumTracker from '@/components/derby/MomentumTracker';
import { useRaceConfig } from '@/hooks/useRaceConfig';

export default function DerbyRace() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const raceId = urlParams.get('id');

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

  const { data: race, isLoading } = useQuery({
    queryKey: ['race', raceId],
    queryFn: async () => {
      const races = await base44.entities.RaceEvent.filter({ id: raceId });
      return races[0] || null;
    },
    enabled: !!raceId,
    refetchInterval: 3000,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['raceEntries', raceId],
    queryFn: () => base44.entities.RaceEntry.filter({ race_id: raceId }),
    enabled: !!raceId,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['raceHorses', entries],
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

  const { data: myBets = [] } = useQuery({
    queryKey: ['myRaceBets', raceId, player?.id],
    queryFn: () => base44.entities.RaceBet.filter({ race_id: raceId, player_id: player.id }),
    enabled: !!raceId && !!player,
  });

  const { data: config, isLoading: configLoading } = useRaceConfig();

  // Check if player is entered as owner
  const isOwnerInRace = entries.some(e => e.owner_id === player?.id);

  const getRaceTypeLabel = (type) => {
    if (type === 'duel') return '2-Horse Duel';
    if (type === 'sprint') return '4-Horse Sprint';
    return '6-Horse Main Event';
  };

  const calculateOdds = (horse) => {
    if (!horse) return null;
    
    // New horses are unrated
    if (horse.races_entered < 3) {
      return { display: 'Unrated', isNew: true, decimal: null };
    }

    // Calculate base probability from skill rating
    const totalSkill = horses.reduce((sum, h) => sum + (h.skill_rating || 1000), 0);
    const baseProb = horse.skill_rating / totalSkill;

    // Adjust for recent form (win rate)
    const winRate = horse.races_entered > 0 ? horse.wins / horse.races_entered : 0;
    const formAdjustment = winRate * 0.2; // Up to 20% boost

    // Adjust for place/show performance
    const placeRate = horse.races_entered > 0 ? (horse.places + horse.shows) / horse.races_entered : 0;
    const consistencyBonus = placeRate * 0.1; // Up to 10% boost

    // Final probability
    const adjustedProb = Math.min(0.95, Math.max(0.05, baseProb + formAdjustment + consistencyBonus));
    
    // Convert to decimal odds
    const decimalOdds = 1 / adjustedProb;
    
    // Convert to fractional for display
    const fractional = decimalOdds - 1;
    
    return {
      display: `${fractional.toFixed(1)}:1`,
      decimal: decimalOdds.toFixed(2),
      isNew: false,
      probability: (adjustedProb * 100).toFixed(1),
    };
  };

  if (isLoading || !race || configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isBettingOpen = race.status === 'open' && new Date(race.cutoff_at) > new Date();
  const timeUntilStart = moment(race.starts_at).diff(moment(), 'minutes');

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${createPageUrl('DerbyRaceShare')}?slug=${race.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('DerbyLobby'))}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>

        {/* Race Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-slate-900/50 border-amber-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">
                    Race #{race.race_number || race.id.slice(0, 6)}
                  </h1>
                  <p className="text-slate-400">{getRaceTypeLabel(race.race_type)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {race.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="border-slate-600 text-slate-300"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                  <div className={`px-4 py-2 rounded-lg ${
                    race.status === 'open' ? 'bg-green-500/20 text-green-400' :
                    race.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {race.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Horses</p>
                  <p className="text-white font-bold">{entries.length}/{race.max_horses}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Owner Purse</p>
                  <p className="text-amber-400 font-bold">{race.total_owner_purse.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Starts</p>
                  <p className="text-white font-bold">{timeUntilStart > 0 ? `${timeUntilStart}m` : 'Soon'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Cutoff</p>
                  <p className="text-white font-bold">{moment(race.cutoff_at).format('h:mm A')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Horses List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Odds Board */}
            <OddsDisplay horses={horses} entries={entries} />
            
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Horses in Race</h2>
                {entries.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No horses entered yet</p>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => {
                      const horse = horses.find(h => h.id === entry.horse_id);
                      if (!horse) return null;
                      
                      const odds = calculateOdds(horse);

                      return (
                        <Card key={entry.id} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl">
                                  {horse.avatar_emoji}
                                </div>
                                <div>
                                  <p className="text-white font-bold">{horse.horse_name}</p>
                                  <p className="text-slate-400 text-sm">Lane {entry.lane_number}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400 text-sm">Odds</p>
                                {odds.isNew ? (
                                  <div className="text-slate-500 font-bold text-sm">
                                    Unrated
                                    <p className="text-xs text-slate-600">New horse</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-amber-400 font-bold">{odds.display}</p>
                                    <p className="text-slate-500 text-xs">{odds.probability}% chance</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-700 flex gap-4 text-xs text-slate-400">
                              <span>Races: {horse.races_entered}</span>
                              <span>Wins: {horse.wins}</span>
                              <span>Rating: {horse.skill_rating}</span>
                              {!odds.isNew && (
                                <span className="text-green-400">Win: {horse.races_entered > 0 ? ((horse.wins / horse.races_entered) * 100).toFixed(0) : 0}%</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Betting & Momentum Sidebar */}
          <div className="space-y-6">
            {/* Momentum Tracker for Owners */}
            {isOwnerInRace && race.status === 'running' && (
              <MomentumTracker
                race={race}
                entries={entries}
                horses={horses}
                playerId={player.id}
                config={config}
              />
            )}

            <BettingSlip
              race={race}
              horses={horses}
              entries={entries}
              player={player}
              isOwnerInRace={isOwnerInRace}
              isBettingOpen={isBettingOpen}
              myBets={myBets}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
