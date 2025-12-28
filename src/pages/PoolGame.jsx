import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Ticket, Users, Clock, Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import VaultBalance from '@/components/vault/VaultBalance';

export default function PoolGame() {
  const navigate = useNavigate();
  const [useVault, setUseVault] = useState(true);
  const queryClient = useQueryClient();

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

  const { data: config } = useQuery({
    queryKey: ['vaultConfig'],
    queryFn: async () => {
      const configs = await base44.entities.VaultConfig.list();
      return configs[0] || {};
    },
  });

  const { data: currentDraw, isLoading: drawLoading } = useQuery({
    queryKey: ['currentPoolDraw'],
    queryFn: async () => {
      const draws = await base44.entities.PoolDraw.filter({ status: 'open' }, '-draw_number', 1);
      return draws[0] || null;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myPoolTickets', player?.id, currentDraw?.id],
    queryFn: async () => {
      if (!currentDraw) return [];
      return await base44.entities.PoolTicket.filter({
        player_id: player.id,
        draw_id: currentDraw.id
      });
    },
    enabled: !!player && !!currentDraw,
  });

  const { data: recentDraws = [] } = useQuery({
    queryKey: ['recentPoolDraws'],
    queryFn: () => base44.entities.PoolDraw.filter({ status: 'executed' }, '-executed_at', 10),
  });

  const buyTicketMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('buyPoolTicket', {
        draw_id: currentDraw.id,
        use_vault: useVault
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['myPoolTickets'] });
      queryClient.invalidateQueries({ queryKey: ['currentPoolDraw'] });
      toast.success('Ticket purchased!');
    },
    onError: (error) => {
      toast.error(error.message || 'Purchase failed');
    },
  });

  if (!currentUser || !player || drawLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!config?.pool_game_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">50/50 Pool</h1>
          <p className="text-slate-400 mb-8">This game is currently unavailable</p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const ticketPrice = config.pool_ticket_price || 1000;
  const canBuy = useVault ? (player.vault_points || 0) >= ticketPrice : player.points_balance >= ticketPrice;
  const maxReached = myTickets.length >= (config.pool_max_tickets_per_player || 100);

  const cutoffTime = currentDraw ? new Date(currentDraw.cutoff_at) : null;
  const isClosed = cutoffTime && new Date() >= cutoffTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <Button
          onClick={() => navigate(createPageUrl('Home'))}
          variant="ghost"
          className="text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
          🎫 50/50 Pool
        </h1>
        <p className="text-slate-400 mb-8">50% to winner, 50% to house allocation</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {currentDraw ? (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Current Pool</span>
                    {cutoffTime && !isClosed && (
                      <span className="text-sm text-blue-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Closes {formatDistanceToNow(cutoffTime, { addSuffix: true })}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm mb-2">Total Pool</p>
                    <p className="text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                      {currentDraw.total_pool.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-sm mt-2">Winner gets {Math.floor(currentDraw.total_pool * 0.5).toLocaleString()} points</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs">Tickets Sold</p>
                      <p className="text-2xl font-black text-white">{currentDraw.total_tickets_sold || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                      <Ticket className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs">Your Tickets</p>
                      <p className="text-2xl font-black text-white">{myTickets.length}</p>
                    </div>
                  </div>

                  {!isClosed ? (
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">
                          <strong>Ticket Price:</strong> {ticketPrice.toLocaleString()} points
                        </p>
                        <p className="text-blue-300 text-xs mt-1">
                          Max {config.pool_max_tickets_per_player} tickets per player
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setUseVault(true)}
                          variant={useVault ? 'default' : 'outline'}
                          className={useVault ? 'bg-purple-500 text-white' : 'border-slate-600'}
                        >
                          Use Vault ({(player.vault_points || 0).toLocaleString()})
                        </Button>
                        <Button
                          onClick={() => setUseVault(false)}
                          variant={!useVault ? 'default' : 'outline'}
                          className={!useVault ? 'bg-green-500 text-white' : 'border-slate-600'}
                        >
                          Use Spendable ({player.points_balance.toLocaleString()})
                        </Button>
                      </div>

                      <Button
                        onClick={() => buyTicketMutation.mutate()}
                        disabled={!canBuy || maxReached || buyTicketMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg py-6"
                      >
                        {buyTicketMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : maxReached ? (
                          'Max Tickets Reached'
                        ) : !canBuy ? (
                          'Insufficient Balance'
                        ) : (
                          `Buy Ticket - ${ticketPrice.toLocaleString()} pts`
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <p className="text-amber-300 text-sm font-bold">
                        🔒 Ticket sales closed. Draw coming soon!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="py-20 text-center">
                  <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No active draw</p>
                  <p className="text-slate-500 text-sm mt-2">Check back soon for the next draw!</p>
                </CardContent>
              </Card>
            )}

            {recentDraws.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Recent Winners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentDraws.slice(0, 5).map((draw) => (
                      <div key={draw.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <div>
                          <p className="text-white font-bold">Draw #{draw.draw_number}</p>
                          <p className="text-slate-400 text-xs">
                            {new Date(draw.executed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {draw.winner_payout?.toLocaleString()} pts
                          </p>
                          <p className="text-slate-500 text-xs">{draw.total_tickets_sold} tickets</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <VaultBalance
              spendable={player.points_balance}
              vault={player.vault_points || 0}
            />

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-400 text-xs">
                <p>1. Buy tickets with vault or spendable points</p>
                <p>2. At draw time, one winner is randomly selected</p>
                <p>3. Winner receives 50% of total pool</p>
                <p>4. Remaining 50% goes to house allocation</p>
                <p>5. All draws are provably fair and auditable</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}