import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Sparkles, Clock, Coins, Users, Shuffle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function NumbersLottery() {
  const [selectedMain, setSelectedMain] = useState([]);
  const [selectedPower, setSelectedPower] = useState(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
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
    queryKey: ['numbersConfig'],
    queryFn: async () => {
      const configs = await base44.entities.NumbersLotteryConfig.list();
      return configs[0] || { enabled: true, ticket_price: 2000 };
    },
  });

  const { data: activeDraw } = useQuery({
    queryKey: ['activeNumbersDraw'],
    queryFn: async () => {
      const draws = await base44.entities.NumbersLotteryDraw.filter({ status: 'open' }, '-created_date', 1);
      return draws[0] || null;
    },
    refetchInterval: 30000,
  });

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myNumbersTickets', player?.id, activeDraw?.id],
    queryFn: () => base44.entities.NumbersLotteryTicket.filter({
      player_id: player.id,
      draw_id: activeDraw.id
    }),
    enabled: !!player && !!activeDraw,
  });

  const { data: recentDraws = [] } = useQuery({
    queryKey: ['recentNumbersDraws'],
    queryFn: () => base44.entities.NumbersLotteryDraw.filter({ status: 'executed' }, '-executed_at', 5),
  });

  const buyTicketMutation = useMutation({
    mutationFn: async ({ draw_id, main, power, quick }) => {
      const response = await base44.functions.invoke('buyNumbersTicket', {
        draw_id,
        main_numbers: main,
        power_number: power,
        is_quick_pick: quick
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Ticket purchased!');
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['activeNumbersDraw'] });
      queryClient.invalidateQueries({ queryKey: ['myNumbersTickets'] });
      setBuyDialogOpen(false);
      setSelectedMain([]);
      setSelectedPower(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Purchase failed');
    },
  });

  const handleMainNumberClick = (num) => {
    if (selectedMain.includes(num)) {
      setSelectedMain(selectedMain.filter(n => n !== num));
    } else if (selectedMain.length < (config?.main_numbers_count || 5)) {
      setSelectedMain([...selectedMain, num]);
    }
  };

  const handleQuickPick = () => {
    const main = [];
    const max = config?.main_numbers_max || 69;
    const min = config?.main_numbers_min || 1;
    const count = config?.main_numbers_count || 5;
    
    while (main.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!main.includes(num)) main.push(num);
    }
    
    const powerMax = config?.power_number_max || 26;
    const powerMin = config?.power_number_min || 1;
    const power = Math.floor(Math.random() * (powerMax - powerMin + 1)) + powerMin;
    
    setSelectedMain(main.sort((a, b) => a - b));
    setSelectedPower(power);
  };

  const handleBuyTicket = () => {
    if (selectedMain.length !== (config?.main_numbers_count || 5)) {
      toast.error(`Select ${config?.main_numbers_count || 5} main numbers`);
      return;
    }
    if (!selectedPower) {
      toast.error('Select a power number');
      return;
    }
    buyTicketMutation.mutate({
      draw_id: activeDraw.id,
      main: selectedMain,
      power: selectedPower,
      quick: false
    });
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const totalPot = activeDraw ? activeDraw.total_pot + (activeDraw.rollover_from_previous || 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400 bg-clip-text text-transparent mb-2">
            🎱 Numbers Lottery
          </h1>
          <p className="text-slate-400 text-sm">Pick your numbers and win big prizes</p>
        </div>

        {/* No Active Draw - How It Works */}
        {!activeDraw && (
          <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Clock className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Active Draw</h3>
                <p className="text-slate-400 mb-4">Next draw starting soon!</p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-lg p-6">
                <h4 className="text-white font-bold mb-4 text-lg">🎱 How Numbers Lottery Works</h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">1.</span>
                    <p>Pick <span className="text-amber-400 font-bold">{config?.main_numbers_count || 5} main numbers</span> ({config?.main_numbers_min || 1}-{config?.main_numbers_max || 69}) + <span className="text-pink-400 font-bold">1 power number</span> ({config?.power_number_min || 1}-{config?.power_number_max || 26})</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">2.</span>
                    <p>Or use <span className="text-blue-400 font-bold">Quick Pick</span> for random numbers</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">3.</span>
                    <p>Wait for the <span className="text-amber-400 font-bold">scheduled draw</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">4.</span>
                    <p>Match numbers to win prizes!</p>
                  </div>
                </div>
              </div>

              {/* Prize Tiers */}
              <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-white font-bold mb-3 text-sm">🏆 Prize Tiers</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">5 Main + Power</span>
                    <span className="text-amber-400 font-bold">JACKPOT ({config?.payout_tier_5_match_percentage || 50}% of pot)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">5 Main</span>
                    <span className="text-green-400 font-bold">{config?.payout_tier_5_percentage || 10}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4 Main + Power</span>
                    <span className="text-blue-400 font-bold">{config?.payout_tier_4_power_percentage || 5}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4 Main</span>
                    <span className="text-purple-400 font-bold">{config?.payout_tier_4_percentage || 3}% of pot</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3 Main + Power</span>
                    <span className="text-pink-400 font-bold">{config?.payout_tier_3_power_percentage || 2}% of pot</span>
                  </div>
                </div>
              </div>

              {config?.rollover_enabled && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                  <p className="text-amber-400 text-sm font-bold">💰 Jackpot rolls over if no top-tier winner!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Draw */}
        {activeDraw && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Coins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-slate-400 text-xs mb-1">Jackpot</p>
                    <p className="text-xl sm:text-2xl font-black text-amber-400">
                      {totalPot.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <p className="text-slate-400 text-xs mb-1">Tickets</p>
                    <p className="text-xl sm:text-2xl font-black text-purple-400">
                      {activeDraw.total_tickets}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center col-span-2">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-slate-400 text-xs mb-1">Draw Time</p>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {moment(activeDraw.draw_at).format('MMM D, h:mm A')}
                    </p>
                  </div>
                </div>

                {myTickets.length > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                    <p className="text-purple-300 font-bold text-sm">Your Tickets: {myTickets.length}</p>
                  </div>
                )}

                <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Buy Ticket ({config?.ticket_price?.toLocaleString()} pts)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Pick Your Numbers</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-slate-400 text-sm">Main Numbers ({selectedMain.length}/{config?.main_numbers_count})</p>
                          <Button size="sm" variant="outline" onClick={handleQuickPick}>
                            <Shuffle className="w-3 h-3 mr-1" />
                            Quick Pick
                          </Button>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: config?.main_numbers_max || 69 }, (_, i) => i + 1).map(num => (
                            <button
                              key={num}
                              onClick={() => handleMainNumberClick(num)}
                              className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                                selectedMain.includes(num)
                                  ? 'bg-purple-600 text-white scale-110'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm mb-2">Power Number</p>
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: config?.power_number_max || 26 }, (_, i) => i + 1).map(num => (
                            <button
                              key={num}
                              onClick={() => setSelectedPower(num)}
                              className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                                selectedPower === num
                                  ? 'bg-pink-600 text-white scale-110'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleBuyTicket}
                        disabled={buyTicketMutation.isPending || selectedMain.length !== (config?.main_numbers_count || 5) || !selectedPower}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                      >
                        {buyTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Purchase Ticket'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Draws */}
        {recentDraws.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Recent Draws</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDraws.map(draw => (
                    <div key={draw.id} className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-bold text-sm">{moment(draw.executed_at).format('MMM D, YYYY')}</p>
                        <p className="text-amber-400 font-bold text-sm">{draw.total_pot?.toLocaleString()} pts</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {draw.winning_main_numbers?.map((num, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                            {num}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold">
                          {draw.winning_power_number}
                        </div>
                      </div>
                      {draw.tier_5_match_winners > 0 && (
                        <p className="text-green-400 text-xs mt-2">
                          🎉 {draw.tier_5_match_winners} jackpot winner{draw.tier_5_match_winners > 1 ? 's' : ''}
                        </p>
                      )}
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
