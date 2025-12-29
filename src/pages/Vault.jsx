import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Vault as VaultIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ticket,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Vault() {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
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

  const { data: vaultAccount } = useQuery({
    queryKey: ['vaultAccount', player?.id],
    queryFn: async () => {
      if (!player) return null;
      const accounts = await base44.entities.VaultAccount.filter({ player_id: player.id });
      if (accounts.length > 0) return accounts[0];
      
      // Create vault account if it doesn't exist
      return await base44.entities.VaultAccount.create({
        player_id: player.id,
        vault_balance: 0,
      });
    },
    enabled: !!player,
  });

  const { data: vaultConfig } = useQuery({
    queryKey: ['vaultConfig'],
    queryFn: async () => {
      const configs = await base44.entities.VaultConfig.list();
      return configs[0] || null;
    },
  });

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myTickets', player?.id],
    queryFn: () => base44.entities.Ticket.filter({ player_id: player.id }),
    enabled: !!player,
  });

  const vaultMutation = useMutation({
    mutationFn: async ({ action, amount }) => {
      const response = await base44.functions.invoke('vaultTransaction', {
        player_id: player.id,
        action, // 'deposit' or 'withdraw'
        amount: parseInt(amount)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['vaultAccount'] });
      setDepositAmount('');
      setWithdrawAmount('');
      toast.success('Transaction complete');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Transaction failed');
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const activeTickets = myTickets.filter(t => t.status === 'active');
  const wonTickets = myTickets.filter(t => t.is_winner);
  const totalWinnings = wonTickets.reduce((sum, t) => sum + (t.payout_amount || 0), 0);
  const vaultBalance = vaultAccount?.vault_balance || 0;
  const interestRate = vaultConfig?.interest_rate_percentage || 0;
  const estimatedDailyInterest = Math.round((vaultBalance * interestRate) / 100 / 365);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent flex items-center gap-3">
            <VaultIcon className="w-10 h-10 text-amber-500" />
            Vault
          </h1>
          <p className="text-slate-400 mt-2">Ticket vault, wallet, and banking controls in one place.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-purple-600 text-white">Tickets stored safely</Badge>
            {interestRate ? (
              <Badge className="bg-green-600 text-white">{interestRate}% APY live</Badge>
            ) : (
              <Badge variant="outline" className="border-slate-600 text-slate-200">Interest ready</Badge>
            )}
          </div>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm">Spendable Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-blue-400">
                  {(player?.points_balance || 0).toLocaleString()}
                </p>
                <p className="text-slate-400 text-xs mt-1">available for games & deposits</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-amber-900/50 to-yellow-900/50 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <VaultIcon className="w-4 h-4" />
                  Vault Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-amber-400">
                  {vaultBalance.toLocaleString()}
                </p>
                <p className="text-slate-400 text-xs mt-1">locked for tickets</p>
                {interestRate > 0 && (
                  <p className="text-green-300 text-xs mt-2">~{estimatedDailyInterest.toLocaleString()} pts daily interest</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Total Winnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-green-400">
                  {totalWinnings.toLocaleString()}
                </p>
                <p className="text-slate-400 text-xs mt-1">{wonTickets.length} winning tickets</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="manage">Manage Vault</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets ({activeTickets.length})</TabsTrigger>
            <TabsTrigger value="store">Ticket Store</TabsTrigger>
          </TabsList>

          {/* Manage Vault */}
          <TabsContent value="manage">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deposit */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ArrowDownToLine className="w-5 h-5 text-green-400" />
                    Deposit to Vault
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-400 text-sm">
                    Move points from spendable into your vault safe to mint tickets and start earning interest.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Amount to deposit"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <div className="flex gap-2">
                      {[1000, 5000, 10000].map(amt => (
                        <Button
                          key={amt}
                          variant="outline"
                          size="sm"
                          onClick={() => setDepositAmount(amt.toString())}
                          className="flex-1 border-slate-600"
                        >
                          {(amt / 1000)}k
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => vaultMutation.mutate({ action: 'deposit', amount: depositAmount })}
                    disabled={!depositAmount || parseInt(depositAmount) <= 0 || vaultMutation.isPending}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    {vaultMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deposit'}
                  </Button>
                </CardContent>
              </Card>

              {/* Withdraw */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5 text-blue-400" />
                    Withdraw from Vault
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-400 text-sm">
                    Unlock points back to your spendable balance when you want to play instantly.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount to withdraw"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(vaultBalance.toString())}
                      className="w-full border-slate-600"
                    >
                      Max: {vaultBalance.toLocaleString()}
                    </Button>
                  </div>
                  <Button
                    onClick={() => vaultMutation.mutate({ action: 'withdraw', amount: withdrawAmount })}
                    disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0 || vaultMutation.isPending}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    {vaultMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Withdraw'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Tickets */}
          <TabsContent value="tickets">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">My Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {myTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No tickets yet</p>
                    <p className="text-slate-500 text-sm">Purchase tickets from the store</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className={`p-4 rounded-lg border-2 ${
                          ticket.is_winner
                            ? 'bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/50'
                            : ticket.status === 'active'
                            ? 'bg-slate-800/30 border-slate-600'
                            : 'bg-slate-800/10 border-slate-700 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-bold">Ticket #{ticket.id.slice(0, 8)}</p>
                            <p className="text-slate-400 text-sm">
                              {new Date(ticket.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              ticket.is_winner ? 'bg-amber-500 text-black' :
                              ticket.status === 'active' ? 'bg-green-500 text-black' :
                              'bg-slate-600 text-white'
                            }>
                              {ticket.is_winner ? '🏆 Winner' : ticket.status}
                            </Badge>
                            {ticket.payout_amount > 0 && (
                              <p className="text-amber-400 font-bold mt-1">
                                +{ticket.payout_amount.toLocaleString()} pts
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <ShieldCheck className="w-3 h-3" />
                          <code className="bg-slate-900/50 px-2 py-1 rounded">{ticket.commit_hash?.slice(0, 16)}...</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store */}
          <TabsContent value="store">
            <Link to={createPageUrl('GameGallery') + '#vault-games'}>
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-12 text-center">
                  <Ticket className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-white mb-2">Browse Ticket Store</h3>
                  <p className="text-slate-300">Vault-ready games filtered for you</p>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
