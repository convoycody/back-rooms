import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Copy, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment-timezone';

export default function NumbersLotteryShare() {
  const [referralCode, setReferralCode] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      if (players[0]) {
        setReferralCode(players[0].referral_code);
      }
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: config } = useQuery({
    queryKey: ['numbersConfig'],
    queryFn: async () => {
      const configs = await base44.entities.NumbersLotteryConfig.list();
      return configs[0];
    },
  });

  const { data: activeDraw } = useQuery({
    queryKey: ['activeNumbersDraw'],
    queryFn: async () => {
      const draws = await base44.entities.NumbersLotteryDraw.filter({ status: 'open' }, '-created_date', 1);
      return draws[0] || null;
    },
    refetchInterval: 10000,
  });

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}${referralCode ? `?ref=${referralCode}` : ''}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const jackpot = activeDraw ? (activeDraw.total_pot + (config.rollover_pot || 0)) : (config.rollover_pot || 0);
  const nextDrawTime = activeDraw?.draw_at ? moment(activeDraw.draw_at).tz('America/New_York').format('MMM D, h:mm A') : 'TBA';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-pink-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black text-white mb-4">🎱 Numbers Lottery</h1>
          <p className="text-purple-300 text-xl font-semibold">Pick Your Numbers, Win Big!</p>
        </motion.div>

        {/* Jackpot Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/80 border-purple-500/50 mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm mb-2">Current Jackpot</p>
                <p className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {jackpot.toLocaleString()}
                </p>
                <p className="text-slate-400 text-lg">points</p>
              </div>

              {activeDraw && (
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-700">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-2">Tickets Sold</p>
                    <p className="text-3xl font-black text-white">{activeDraw.total_tickets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-2 flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Next Draw
                    </p>
                    <p className="text-white font-semibold">{nextDrawTime}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How to Play</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">1</div>
                  <div>
                    <p className="text-white font-semibold">Pick Your Numbers</p>
                    <p className="text-slate-400 text-sm">Choose {config.main_numbers_count} numbers from {config.main_numbers_min}-{config.main_numbers_max} and 1 power number from {config.power_number_min}-{config.power_number_max}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">2</div>
                  <div>
                    <p className="text-white font-semibold">Buy Your Ticket</p>
                    <p className="text-slate-400 text-sm">Each ticket costs {config.ticket_price?.toLocaleString()} points from your vault</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">3</div>
                  <div>
                    <p className="text-white font-semibold">Wait for the Draw</p>
                    <p className="text-slate-400 text-sm">Draws happen weekly - check back for results!</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">4</div>
                  <div>
                    <p className="text-white font-semibold">Win Big!</p>
                    <p className="text-slate-400 text-sm">Match all numbers for the jackpot, or win on partial matches</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-white font-bold mb-3">Prize Tiers</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">5 + Power</span>
                    <span className="text-purple-400 font-bold">{config.payout_tier_5_match_percentage}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">5 Match</span>
                    <span className="text-purple-400 font-bold">{config.payout_tier_5_percentage}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4 + Power</span>
                    <span className="text-purple-400 font-bold">{config.payout_tier_4_power_percentage}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4 Match</span>
                    <span className="text-purple-400 font-bold">{config.payout_tier_4_percentage}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3 + Power</span>
                    <span className="text-purple-400 font-bold">{config.payout_tier_3_power_percentage}% of pot</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          {currentUser ? (
            <Button
              onClick={() => window.location.href = '/NumbersLottery'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-lg px-8 py-6"
            >
              🎱 Get Your Numbers Now
            </Button>
          ) : (
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-lg px-8 py-6"
            >
              🎱 Join Now & Play
            </Button>
          )}

          {referralCode && (
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
              >
                <Copy className="w-4 h-4 mr-2" />
                Share This Lottery
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}