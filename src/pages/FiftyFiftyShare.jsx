import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Copy, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function FiftyFiftyShare() {
  const [referralCode, setReferralCode] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: _player } = useQuery({
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
    queryKey: ['fiftyConfig'],
    queryFn: async () => {
      const configs = await base44.entities.FiftyFiftyConfig.list();
      return configs[0];
    },
  });

  const { data: activePool } = useQuery({
    queryKey: ['activeFiftyPool'],
    queryFn: async () => {
      const today = moment().format('YYYY-MM-DD');
      const pools = await base44.entities.FiftyFiftyPool.filter({ pool_date: today });
      return pools[0] || null;
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

  const nextDrawTime = activePool?.draw_at ? moment(activePool.draw_at).format('h:mm A') : `${config.draw_hour_et || 21}:00`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black text-white mb-4">🎯 50/50 Pool</h1>
          <p className="text-green-300 text-xl font-semibold">Win 50% of the Total Pot!</p>
        </motion.div>

        {/* Active Pool Info */}
        {activePool ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900/80 border-green-500/50 mb-8">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Current Pot</p>
                    <p className="text-4xl font-black text-green-400">
                      {activePool.total_pot.toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-sm">points</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Winner Takes</p>
                    <p className="text-4xl font-black text-amber-400">
                      {Math.floor(activePool.total_pot / 2).toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-sm">points</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Total Tickets</p>
                    <p className="text-4xl font-black text-white">
                      {activePool.total_tickets}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Next Draw: Today at {nextDrawTime} ET</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900/80 border-slate-700/50 mb-8">
              <CardContent className="p-8 text-center">
                <p className="text-slate-400 mb-2">No active pool right now</p>
                <p className="text-slate-500 text-sm">Check back soon for the next draw!</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-bold">1</div>
                  <div>
                    <p className="text-white font-semibold">Buy Your Ticket</p>
                    <p className="text-slate-400 text-sm">Each ticket costs {config.ticket_price?.toLocaleString()} points and is stored in your vault wallet</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-bold">2</div>
                  <div>
                    <p className="text-white font-semibold">Wait for the Draw</p>
                    <p className="text-slate-400 text-sm">Draws happen daily at {config.draw_hour_et}:00 ET</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-bold">3</div>
                  <div>
                    <p className="text-white font-semibold">One Ticket Wins</p>
                    <p className="text-slate-400 text-sm">Winner takes 50% of the total pot!</p>
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
              onClick={() => window.location.href = '/FiftyFiftyPool'}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg px-8 py-6"
            >
              🎯 Get Your Tickets Now
            </Button>
          ) : (
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg px-8 py-6"
            >
              🎯 Join Now & Play
            </Button>
          )}

          {referralCode && (
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="border-green-500/50 text-green-300 hover:bg-green-500/10"
              >
                <Copy className="w-4 h-4 mr-2" />
                Share This Pool
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
