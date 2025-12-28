import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Wallet as WalletIcon, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import DailyBonusCard from '@/components/casino/DailyBonusCard';
import NoonDropCard from '@/components/NoonDropCard';
import TopUpCard from '@/components/casino/TopUpCard';

export default function Wallet() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player, refetch: refetchPlayer } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: ledger = [], isLoading } = useQuery({
    queryKey: ['ledger', player?.id],
    queryFn: () => base44.entities.Ledger.filter({ player_id: player.id }, '-created_date', 50),
    enabled: !!player,
  });

  const { data: noonDropHistory = [] } = useQuery({
    queryKey: ['noonDropHistory'],
    queryFn: () => base44.entities.NoonDropDraw.filter({ status: 'executed' }, '-draw_time', 10),
  });

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const getReasonIcon = (reason) => {
    if (reason === 'game_win') return '🎉';
    if (reason === 'game_bet') return '🎲';
    if (reason === 'daily_bonus') return '🎁';
    if (reason === 'signup_bonus') return '✨';
    if (reason === 'level_up_bonus') return '⬆️';
    if (reason === 'referral_bonus') return '👥';
    if (reason === 'jackpot_win') return '💰';
    if (reason === 'admin_adjustment') return '⚙️';
    return '💵';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            💰 Wallet
          </h1>
          <p className="text-slate-400 mt-2">Manage your balance and view transaction history</p>
        </div>

        {/* Balance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm mb-2">Current Balance</p>
                <p className="text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                  {player.points_balance?.toLocaleString() || 0}
                </p>
                <p className="text-slate-400 text-sm mt-1">points</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-1">Total Wagered</p>
                  <p className="text-white font-bold">{player.total_wagered?.toLocaleString() || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-1">Total Won</p>
                  <p className="text-green-400 font-bold">{player.total_won?.toLocaleString() || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-1">Games Played</p>
                  <p className="text-white font-bold">{player.games_played || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bonus Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <DailyBonusCard 
            playerId={player.id} 
            balance={player.points_balance}
            onClaimed={() => refetchPlayer()}
          />
          <TopUpCard
            playerId={player.id}
            balance={player.points_balance}
            onTopUp={() => refetchPlayer()}
          />
          <NoonDropCard />
        </motion.div>

        {/* Noon Drop History */}
        {noonDropHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Noon Drop History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {noonDropHistory.map((draw) => (
                    <div key={draw.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <p className="text-white font-semibold">{draw.winner_display_name}</p>
                        <p className="text-slate-400 text-xs">{moment(draw.draw_time).format('MMM D, YYYY')}</p>
                      </div>
                      <p className="text-amber-400 font-bold">
                        {draw.prize_amount?.toLocaleString()} pts
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-amber-400" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ledger.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getReasonIcon(entry.reason)}</span>
                      <div>
                        <p className="text-white font-medium capitalize">
                          {entry.reason.replace(/_/g, ' ')}
                        </p>
                        <p className="text-slate-400 text-xs">{moment(entry.created_date).fromNow()}</p>
                        {entry.note && <p className="text-slate-500 text-xs">{entry.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.change >= 0 ? '+' : ''}{entry.change.toLocaleString()}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Balance: {entry.balance_after?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}