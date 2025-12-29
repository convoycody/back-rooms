import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Ticket, Users, Coins, Clock, TrendingUp, AlertCircle, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function FiftyFiftyPool() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: config } = useQuery({
    queryKey: ['fiftyFiftyConfig'],
    queryFn: async () => {
      const configs = await base44.entities.FiftyFiftyConfig.list();
      return configs[0] || { enabled: true, ticket_price: 1000 };
    },
  });

  const { data: activePool, isLoading: poolLoading } = useQuery({
    queryKey: ['activeFiftyFiftyPool'],
    queryFn: async () => {
      const pools = await base44.entities.FiftyFiftyPool.filter({ status: 'open' }, '-created_date', 1);
      return pools[0] || null;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myFiftyFiftyTickets', player?.id, activePool?.id],
    queryFn: () => base44.entities.FiftyFiftyTicket.filter({ 
      player_id: player.id,
      pool_id: activePool.id,
      status: 'active'
    }),
    enabled: !!player && !!activePool,
  });

  const { data: recentPools = [] } = useQuery({
    queryKey: ['recentFiftyFiftyPools'],
    queryFn: () => base44.entities.FiftyFiftyPool.filter({ status: 'executed' }, '-executed_at', 10),
  });

  const buyTicketMutation = useMutation({
    mutationFn: async ({ pool_id, qty }) => {
      const response = await base44.functions.invoke('buyFiftyFiftyTicket', { 
        pool_id, 
        quantity: qty 
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Purchased ${data.tickets.length} ticket${data.tickets.length > 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['activeFiftyFiftyPool'] });
      queryClient.invalidateQueries({ queryKey: ['myFiftyFiftyTickets'] });
      setBuyDialogOpen(false);
      setQuantity(1);
      refetchPlayer();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to purchase ticket');
    },
  });

  const handleBuyTickets = async () => {
    if (!activePool) {
      toast.error('No active pool available');
      return;
    }
    if (quantity < 1 || quantity > 50) {
      toast.error('Quantity must be between 1 and 50');
      return;
    }

    const ticketPrice = config?.ticket_price || 1000;
    const totalCost = ticketPrice * quantity;
    const vaultBalance = player?.vault_points || 0;
    const spendableBalance = player?.points_balance || 0;
    const shortfall = totalCost - vaultBalance;

    try {
      setPurchaseLoading(true);
      if (shortfall > 0) {
        if (spendableBalance < shortfall) {
          toast.error('Not enough points to cover these tickets.');
          setPurchaseLoading(false);
          return;
        }
        await base44.functions.invoke('depositToVault', { amount: shortfall });
        queryClient.invalidateQueries({ queryKey: ['player'] });
        queryClient.invalidateQueries({ queryKey: ['vaultTransactions', player?.id] });
      }

      await buyTicketMutation.mutateAsync({ pool_id: activePool.id, qty: quantity });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to purchase ticket');
      setPurchaseLoading(false);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (poolLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const vaultBalance = player?.vault_points || 0;
  const spendableBalance = player?.points_balance || 0;
  const ticketPrice = config?.ticket_price || 1000;
  const maxTicketsAffordable = Math.floor((vaultBalance + spendableBalance) / ticketPrice);
  const cutoffTime = activePool ? new Date(activePool.cutoff_at) : null;
  const isCutoffPassed = cutoffTime && new Date() >= cutoffTime;
  const potentialWinning = activePool ? Math.floor(activePool.total_pot * 0.5) + (ticketPrice * quantity * 0.5) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent mb-3">
            🎯 50/50 Pool
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Buy tickets for a chance to win 50% of the total pot</p>
        </div>

        {!config?.enabled && (
          <Card className="bg-red-900/20 border-red-500/50 mb-8">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-bold">50/50 Pool is currently disabled</p>
            </CardContent>
          </Card>
        )}

        {/* Active Pool */}
        {activePool && !isCutoffPassed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Trophy className="w-6 h-6 text-green-400" />
                  Current Pool - {moment(activePool.pool_date).format('MMM D, YYYY')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <Coins className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs mb-1">Total Pot</p>
                    <p className="text-2xl font-black text-amber-400">
                      {activePool.total_pot?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs mb-1">Total Tickets</p>
                    <p className="text-2xl font-black text-green-400">
                      {activePool.total_tickets || 0}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs mb-1">Winner Gets</p>
                    <p className="text-2xl font-black text-purple-400">
                      {Math.floor(activePool.total_pot * 0.5).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-300 font-bold text-sm">Draw Time</p>
                      <p className="text-slate-300 text-sm">
                        {moment(activePool.draw_at).format('MMM D, YYYY h:mm A')} ET
                      </p>
                      <p className="text-blue-400 text-xs mt-1">
                        Sales close: {moment(activePool.cutoff_at).format('h:mm A')} ET
                      </p>
                    </div>
                  </div>
                </div>

                {myTickets.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                    <p className="text-green-300 font-bold mb-1">Your Tickets</p>
                    <p className="text-white text-2xl font-black">{myTickets.length}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {((myTickets.length / (activePool.total_tickets || 1)) * 100).toFixed(2)}% chance to win
                    </p>
                  </div>
                )}

                <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg py-6"
                      disabled={!config?.enabled}
                    >
                      <Ticket className="w-5 h-5 mr-2" />
                      Buy Tickets
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Purchase 50/50 Tickets</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
                        <p className="text-amber-300 text-sm font-semibold">Ticket Funds</p>
                        <p className="text-white text-sm flex items-center justify-between">
                          <span>Vault safe</span>
                          <span className="font-bold">{vaultBalance.toLocaleString()} pts</span>
                        </p>
                        <p className="text-white text-sm flex items-center justify-between">
                          <span>Spendable balance</span>
                          <span className="font-bold">{spendableBalance.toLocaleString()} pts</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          We auto-move points from spendable to vault to mint your tickets. Can afford: {maxTicketsAffordable} tickets.
                        </p>
                      </div>

                      <div>
                        <Label className="text-slate-400">Quantity</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          min={1}
                          max={50}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        <p className="text-slate-500 text-xs mt-1">
                          {ticketPrice.toLocaleString()} pts per ticket • Total: {(ticketPrice * quantity).toLocaleString()} pts
                        </p>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                        <p className="text-purple-300 text-sm">Potential Winning</p>
                        <p className="text-white text-2xl font-black">
                          ~{potentialWinning.toLocaleString()} pts
                        </p>
                      </div>

                      <Button
                        onClick={handleBuyTickets}
                        disabled={buyTicketMutation.isPending || purchaseLoading || (vaultBalance + spendableBalance) < ticketPrice * quantity}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        {buyTicketMutation.isPending || purchaseLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `Buy ${quantity} Ticket${quantity > 1 ? 's' : ''}`
                        )}
                      </Button>

                      {(vaultBalance + spendableBalance) < ticketPrice * quantity && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(createPageUrl('Wallet'))}
                        >
                          Add points to continue
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No Active Pool */}
        {!activePool && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Clock className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Active Pool</h3>
                <p className="text-slate-400 mb-4">Check back soon for the next draw!</p>
              </div>

              {/* How It Works */}
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-lg p-6">
                <h4 className="text-white font-bold mb-4 text-lg">🎯 How 50/50 Pool Works</h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">1.</span>
                    <p>Tickets are stored in your vault wallet ({config?.ticket_price?.toLocaleString()} points each).</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">2.</span>
                    <p>All ticket sales go into a <span className="text-purple-400 font-bold">total pot</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">3.</span>
                    <p>At draw time, <span className="text-amber-400 font-bold">one random ticket wins 50%</span> of the pot</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">4.</span>
                    <p>The other 50% goes to the platform reserve</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">💡</span>
                    <p>More tickets = bigger pot = bigger potential win!</p>
                  </div>
                </div>
              </div>

              {/* Example */}
              <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Example:</p>
                <p className="text-sm text-slate-300">
                  100 tickets sold × {config?.ticket_price?.toLocaleString()} pts = <span className="text-amber-400 font-bold">{(100 * (config?.ticket_price || 1000)).toLocaleString()} pts</span> pot
                </p>
                <p className="text-sm text-green-400 font-bold mt-1">
                  Winner gets: {((100 * (config?.ticket_price || 1000)) / 2).toLocaleString()} pts
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Winners */}
        {recentPools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Recent Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPools.map((pool) => (
                    <div key={pool.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate">{pool.winner_display_name}</p>
                        <p className="text-slate-400 text-xs">{moment(pool.executed_at).format('MMM D, YYYY')}</p>
                        <p className="text-slate-500 text-xs">{pool.total_tickets} tickets • {pool.total_pot.toLocaleString()} pts pot</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-green-400 font-bold text-lg">
                          {pool.winner_share?.toLocaleString()}
                        </p>
                        <p className="text-slate-500 text-xs">won</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
