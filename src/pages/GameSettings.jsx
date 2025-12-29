import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Gamepad2, Coins, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameSettings() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const isAdmin = player?.is_admin || currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-red-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Admin privileges required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Admin')}>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-purple-500" />
                Game Settings Dashboard
              </h1>
              <p className="text-slate-400">Configure all game types and settings</p>
            </div>
          </div>
        </div>

        {/* Classic Games */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            Classic Casino Games
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to={createPageUrl('SlotsAdmin')}>
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <span className="text-5xl block mb-3">🎰</span>
                  <h3 className="text-xl font-bold text-white mb-1">Slots</h3>
                  <p className="text-slate-400 text-sm">RTP, volatility, jackpot, bet limits</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('PlinkoAdmin')}>
              <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-700/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <span className="text-5xl block mb-3">🎯</span>
                  <h3 className="text-xl font-bold text-white mb-1">Plinko</h3>
                  <p className="text-slate-400 text-sm">Rows, bet limits, multipliers</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('BlackjackAdmin')}>
              <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <span className="text-5xl block mb-3">🃏</span>
                  <h3 className="text-xl font-bold text-white mb-1">Blackjack</h3>
                  <p className="text-slate-400 text-sm">Payouts, bet limits, rules</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Vault Games */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-400" />
            Vault Games (Lottery)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to={createPageUrl('FiftyFiftyAdmin')}>
              <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <span className="text-5xl block mb-3">🎯</span>
                  <h3 className="text-xl font-bold text-white mb-1">50/50 Pool</h3>
                  <p className="text-slate-400 text-sm">Ticket price, draw schedule, pool caps</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('NumbersLotteryAdmin')}>
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <span className="text-5xl block mb-3">🎱</span>
                  <h3 className="text-xl font-bold text-white mb-1">Numbers Lottery</h3>
                  <p className="text-slate-400 text-sm">Numbers config, payouts, rollover</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Flagship Platform Games */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Flagship Platform Games
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to={createPageUrl('DerbyAdmin')}>
              <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <span className="text-5xl block mb-3">🏇</span>
                  <h3 className="text-xl font-bold text-white mb-1">Derby Racetrack</h3>
                  <p className="text-slate-400 text-sm">Entry fees, purses, odds, momentum</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-slate-800/30 border-slate-700/50 opacity-50">
              <CardContent className="p-6 text-center">
                <span className="text-5xl block mb-3">🎮</span>
                <h3 className="text-xl font-bold text-slate-500 mb-1">More Coming Soon</h3>
                <p className="text-slate-600 text-sm">Future flagship games</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}