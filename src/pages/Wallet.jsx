import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Wallet as WalletIcon, Clock, Landmark, ShieldCheck, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import DailyBonusCard from '@/components/casino/DailyBonusCard';
import NoonDropCard from '@/components/NoonDropCard';
import TopUpCard from '@/components/casino/TopUpCard';
import VaultBalanceCard from '@/components/vault/VaultBalanceCard';

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

  const { data: vaultConfig } = useQuery({
    queryKey: ['vaultConfig'],
    queryFn: async () => {
      const configs = await base44.entities.VaultConfig.list();
      return configs[0] || null;
    },
  });

  const { data: vaultTransactions = [] } = useQuery({
    queryKey: ['vaultTransactions', player?.id],
    queryFn: () => base44.entities.VaultTransaction.filter({ player_id: player.id }, '-created_date', 25),
    enabled: !!player,
  });

  const { data: noonDropHistory = [] } = useQuery({
    queryKey: ['noonDropHistory'],
    queryFn: () => base44.entities.NoonDropDraw.filter({ status: 'executed' }, '-draw_time', 10),
  });

  const { data: myTickets = [] } = useQuery({
    queryKey: ['walletTickets', player?.id],
    queryFn: () => base44.entities.Ticket.filter({ player_id: player.id }),
    enabled: !!player,
  });

  const vaultBalance = player?.vault_points || 0;
  const spendableBalance = player?.points_balance || 0;
  const interestRate = vaultConfig?.interest_rate_percentage || 0;
  const estimatedDailyInterest = Math.round((vaultBalance * interestRate) / 100 / 365);
  const estimatedMonthlyInterest = Math.round((vaultBalance * interestRate) / 100 / 12);
  const activeTickets = myTickets.filter(t => t.status === 'active');
  const winningTickets = myTickets.filter(t => t.is_winner);

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
    if (reason === 'vault_deposit') return '📥';
    if (reason === 'vault_withdraw') return '📤';
    return '💵';
  };

  // Combine ledger and vault transactions for unified view
  const allTransactions = [
    ...ledger.map(l => ({ ...l, source: 'ledger' })),
    ...vaultTransactions.map(vt => ({
      id: vt.id,
      created_date: vt.created_date,
      reason: vt.transaction_type === 'deposit' ? 'vault_deposit' : 
              vt.transaction_type === 'withdraw' ? 'vault_withdraw' : 
              vt.transaction_type,
      change: vt.transaction_type === 'withdraw' ? vt.amount : -vt.amount,
      balance_after: vt.spendable_balance_after ?? (vt.transaction_type === 'withdraw' ? spendableBalance + vt.amount : Math.max(spendableBalance - vt.amount, 0)),
      note: vt.note || 'Vault transfer recorded',
      source: 'vault',
      vault_amount: vt.amount
    }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
   .slice(0, 50);

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
          <p className="text-slate-400 mt-2">Manage spendable funds, vault interest, ticket storage, and banking activity.</p>
        </div>

        {/* Balance Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-slate-400 text-sm mb-2">Spendable Balance</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    {player.points_balance?.toLocaleString() || 0}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">points</p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Wagered</p>
                    <p className="text-white font-bold text-sm">{player.total_wagered?.toLocaleString() || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Won</p>
                    <p className="text-green-400 font-bold text-sm">{player.total_won?.toLocaleString() || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Games</p>
                    <p className="text-white font-bold text-sm">{player.games_played || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <VaultBalanceCard 
            player={player} 
            config={vaultConfig}
            onUpdate={refetchPlayer}
          />
        </div>

        {/* Banking & Interest */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-700/40">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Vault Interest</p>
                  <p className="text-3xl font-black text-purple-200">{interestRate ? `${interestRate}% APY` : 'Interest ready'}</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <LineChart className="w-6 h-6 text-purple-300" />
                </div>
              </div>
              <p className="text-slate-300 text-sm">
                Earning interest on {vaultBalance.toLocaleString()} vault pts. Estimated daily: {estimatedDailyInterest.toLocaleString()} pts • Monthly: {estimatedMonthlyInterest.toLocaleString()} pts.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <p className="text-white font-semibold text-sm">{vaultBalance.toLocaleString()} pts</p>
                  <p className="text-slate-500 mt-1">Vault principal</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <p className="text-white font-semibold text-sm">{spendableBalance.toLocaleString()} pts</p>
                  <p className="text-slate-500 mt-1">Spendable</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/70 border-slate-800/70">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Advanced Banking</p>
                  <p className="text-xl font-black text-white">Ticket-safe controls</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Landmark className="w-6 h-6 text-amber-300" />
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <p>Auto-sweep points from spendable into the vault when buying tickets.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <p>Tickets live in your vault wallet; view winners and redemptions in one place.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <p>Banking timeline synced to ledger + vault movements for audit-ready reporting.</p>
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
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

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 grid sm:grid-cols-2 gap-4"
        >
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🎫</span>
                  My Vault Tickets
                </h3>
                <Link to={createPageUrl('VaultTickets')}>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="text-center py-4">
                <p className="text-slate-300 text-sm mb-1">{activeTickets.length} active • {winningTickets.length} wins • {myTickets.length} stored</p>
                <p className="text-slate-500 text-xs mb-2">Tickets sit in your vault + wallet for quick claiming.</p>
                <a href={createPageUrl('GameGallery') + '#vault-games'}>
                  <Button variant="outline" size="sm" className="border-purple-600 text-purple-300 hover:bg-purple-500/10">
                    🎰 Browse Ticketed Vault Games
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🐴</span>
                  My Stable
                </h3>
                <Link to={createPageUrl('DerbyStable')}>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    View Stable
                  </Button>
                </Link>
              </div>
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-3">Manage your racing horses</p>
                <Link to={createPageUrl('DerbyLobby')}>
                  <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-500/10">
                    🏇 View Races
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
                {allTransactions.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{getReasonIcon(entry.reason)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium capitalize text-sm sm:text-base truncate">
                          {entry.reason.replace(/_/g, ' ')}
                        </p>
                        <p className="text-slate-400 text-xs">{moment(entry.created_date).fromNow()}</p>
                        {entry.note && <p className="text-slate-500 text-xs truncate">{entry.note}</p>}
                        {entry.source === 'vault' && (
                          <Link 
                            to={createPageUrl('Vault')} 
                            className="text-purple-300 text-xs hover:text-purple-200 font-semibold"
                          >
                            View Vault details →
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {entry.source === 'vault' ? (
                        <>
                          <p className={`font-bold text-sm sm:text-lg ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.change >= 0 ? '+' : ''}{entry.change.toLocaleString()} pts
                          </p>
                          <p className="text-purple-300 text-xs">
                            Vault: {entry.vault_amount >= 0 ? '→' : '←'} {Math.abs(entry.vault_amount).toLocaleString()} pts
                          </p>
                          <p className="text-slate-500 text-xs">Spendable after: {entry.balance_after?.toLocaleString() || 0}</p>
                        </>
                      ) : (
                        <>
                          <p className={`font-bold text-sm sm:text-lg ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.change >= 0 ? '+' : ''}{entry.change.toLocaleString()}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {entry.balance_after?.toLocaleString() || 0}
                          </p>
                        </>
                      )}
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
