import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Users, Clock, Trophy, ArrowLeft, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import VaultBalance from '@/components/vault/VaultBalance';

export default function LotteryGame() {
  const navigate = useNavigate();
  const [useVault, setUseVault] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [powerNumber, setPowerNumber] = useState(null);
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
    queryKey: ['currentLotteryDraw'],
    queryFn: async () => {
      const draws = await base44.entities.LotteryDraw.filter({ status: 'open' }, '-draw_number', 1);
      return draws[0] || null;
    },
    refetchInterval: 30000,
  });

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myLotteryTickets', player?.id, currentDraw?.id],
    queryFn: async () => {
      if (!currentDraw) return [];
      return await base44.entities.LotteryTicket.filter({
        player_id: player.id,
        draw_id: currentDraw.id
      });
    },
    enabled: !!player && !!currentDraw,
  });

  const { data: recentDraws = [] } = useQuery({
    queryKey: ['recentLotteryDraws'],
    queryFn: () => base44.entities.LotteryDraw.filter({ status: 'executed' }, '-executed_at', 5),
  });

  const buyTicketMutation = useMutation({
    mutationFn: async (isQuickPick) => {
      const { data } = await base44.functions.invoke('buyLotteryTicket', {
        draw_id: currentDraw.id,
        numbers: isQuickPick ? null : selectedNumbers,
        power_number: isQuickPick ? null : powerNumber,
        use_vault: useVault,
        quick_pick: isQuickPick
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['myLotteryTickets'] });
      queryClient.invalidateQueries({ queryKey: ['currentLotteryDraw'] });
      toast.success('Ticket purchased!');
      setSelectedNumbers([]);
      setPowerNumber(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Purchase failed');
    },
  });

  const toggleNumber = (num) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 5) {
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  if (!currentUser || !player || drawLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!config?.lottery_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Vault Lottery</h1>
          <p className="text-slate-400 mb-8">This game is currently unavailable</p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>Return Home</Button>
        </div>
      </div>
    );
  }

  const ticketPrice = config.lottery_ticket_price || 5000;
  const canBuy = useVault ? (player.vault_points || 0) >= ticketPrice : player.points_balance >= ticketPrice;
  const maxReached = myTickets.length >= (config.lottery_max_tickets_per_player || 50);
  const canSubmit = (selectedNumbers.length === 5 && powerNumber !== null) || config.lottery_allow_quick_pick;

  const cutoffTime = currentDraw ? new Date(currentDraw.cutoff_at) : null;
  const isClosed = cutoffTime && new Date() >= cutoffTime;

  const jackpotPool = currentDraw ? Math.floor((currentDraw.total_pool + (currentDraw.rollover_from_previous || 0)) * ((config.lottery_jackpot_pool_pct || 50) / 100)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <Button onClick={() => navigate(createPageUrl('Home'))} variant="ghost" className="text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
          🎰 Vault Lottery
        </h1>
        <p className="text-slate-400 mb-8">Pick 5 numbers + power ball or quick pick</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {currentDraw ? (
              <>
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>Current Jackpot</span>
                      {cutoffTime && !isClosed && (
                        <span className="text-sm text-blue-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Closes {formatDistanceToNow(cutoffTime, { addSuffix: true })}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm mb-2">Jackpot Prize Pool</p>
                      <p className="text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                        {jackpotPool.toLocaleString()}
                      </p>
                      {currentDraw.rollover_from_previous > 0 && (
                        <p className="text-amber-500 text-sm mt-2">
                          +{currentDraw.rollover_from_previous.toLocaleString()} rollover
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs">Tickets Sold</p>
                        <p className="text-2xl font-black text-white">{currentDraw.total_tickets_sold || 0}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs">Your Tickets</p>
                        <p className="text-2xl font-black text-white">{myTickets.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {!isClosed && (
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Pick Your Numbers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-slate-400 text-sm mb-3">
                          Pick 5 numbers (1-69): {selectedNumbers.length}/5
                        </p>
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: 69 }, (_, i) => i + 1).map((num) => (
                            <button
                              key={num}
                              onClick={() => toggleNumber(num)}
                              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                selectedNumbers.includes(num)
                                  ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-black scale-110'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm mb-3">
                          Pick power number (1-26): {powerNumber ? '✓' : ''}
                        </p>
                        <div className="grid grid-cols-13 gap-2">
                          {Array.from({ length: 26 }, (_, i) => i + 1).map((num) => (
                            <button
                              key={num}
                              onClick={() => setPowerNumber(num)}
                              className={`w-10 h-10 rounded-full font-bold transition-all ${
                                powerNumber === num
                                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-110'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">
                          <strong>Ticket Price:</strong> {ticketPrice.toLocaleString()} points
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

                      <div className="grid grid-cols-2 gap-3">
                        {config.lottery_allow_quick_pick && (
                          <Button
                            onClick={() => buyTicketMutation.mutate(true)}
                            disabled={!canBuy || maxReached || buyTicketMutation.isPending}
                            variant="outline"
                            className="border-amber-600 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Shuffle className="w-4 h-4 mr-2" />
                            Quick Pick
                          </Button>
                        )}
                        <Button
                          onClick={() => buyTicketMutation.mutate(false)}
                          disabled={!canBuy || maxReached || !canSubmit || buyTicketMutation.isPending}
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold"
                        >
                          {buyTicketMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            'Buy Ticket'
                          )}
                        </Button>
                      </div>

                      {!canBuy && <p className="text-red-400 text-sm text-center">Insufficient balance</p>}
                      {maxReached && <p className="text-amber-400 text-sm text-center">Max tickets reached</p>}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="py-20 text-center">
                  <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No active draw</p>
                </CardContent>
              </Card>
            )}

            {recentDraws.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Recent Draws</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentDraws.map((draw) => (
                      <div key={draw.id} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white font-bold">Draw #{draw.draw_number}</p>
                          <p className="text-slate-400 text-xs">{new Date(draw.executed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 mb-2">
                          {draw.winning_numbers?.map((num, idx) => (
                            <div key={idx} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                              {num}
                            </div>
                          ))}
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {draw.power_number}
                          </div>
                        </div>
                        <p className="text-green-400 text-sm">
                          {draw.jackpot_winners > 0 ? `${draw.jackpot_winners} jackpot winner(s)!` : 'No jackpot winner'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <VaultBalance spendable={player.points_balance} vault={player.vault_points || 0} />

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Prize Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-slate-400 text-xs">
                <div className="flex justify-between">
                  <span>5 + Power</span>
                  <span className="text-amber-400 font-bold">Jackpot ({config.lottery_jackpot_pool_pct}%)</span>
                </div>
                <div className="flex justify-between">
                  <span>5</span>
                  <span>{config.lottery_match5_pool_pct}% pool</span>
                </div>
                <div className="flex justify-between">
                  <span>4 + Power</span>
                  <span>{config.lottery_match4_power_pool_pct}% pool</span>
                </div>
                <div className="flex justify-between">
                  <span>4</span>
                  <span>{config.lottery_match4_pool_pct}% pool</span>
                </div>
                <div className="flex justify-between">
                  <span>3 + Power</span>
                  <span>{config.lottery_match3_power_pool_pct}% pool</span>
                </div>
                <p className="text-blue-300 text-xs mt-3">Parimutuel system - prizes split among winners in each tier</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}