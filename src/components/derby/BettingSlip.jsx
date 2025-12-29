import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BettingSlip({ race, horses, entries, player, isOwnerInRace, isBettingOpen, myBets }) {
  const queryClient = useQueryClient();
  const [selectedHorse, setSelectedHorse] = useState('');
  const [betType, setBetType] = useState('win');
  const [amount, setAmount] = useState('');

  const placeBetMutation = useMutation({
    mutationFn: async (betData) => {
      // Validate
      if (!selectedHorse || !amount || parseFloat(amount) <= 0) {
        throw new Error('Please select a horse and enter amount');
      }

      const betAmount = parseFloat(amount);
      if (betAmount < 100) throw new Error('Minimum bet is 100 points');
      if (betAmount > 50000) throw new Error('Maximum bet is 50,000 points');
      if (betAmount > player.points_balance) throw new Error('Insufficient balance');

      // Create bet
      await base44.entities.RaceBet.create({
        race_id: race.id,
        player_id: player.id,
        horse_id: selectedHorse,
        bet_type: betType,
        amount: betAmount,
        odds_at_time: 0, // Will be calculated
      });

      // Update race pools
      const poolField = `total_${betType}_pool`;
      await base44.entities.RaceEvent.update(race.id, {
        [poolField]: (race[poolField] || 0) + betAmount,
      });

      // Deduct from player balance
      await base44.entities.Player.update(player.id, {
        points_balance: player.points_balance - betAmount,
      });

      // Create ledger entry
      await base44.entities.Ledger.create({
        player_id: player.id,
        change: -betAmount,
        reason: 'game_bet',
        balance_after: player.points_balance - betAmount,
        note: `${betType.toUpperCase()} bet on race ${race.id.slice(0, 6)}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['myRaceBets'] });
      toast.success('Bet placed!');
      setAmount('');
      setSelectedHorse('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place bet');
    },
  });

  const quickBetMutation = useMutation({
    mutationFn: async ({ horse, amounts }) => {
      const totalAmount = amounts.win + amounts.place + amounts.show;
      if (totalAmount > player.points_balance) {
        throw new Error('Insufficient balance');
      }

      const bets = [];
      if (amounts.win > 0) {
        bets.push({
          race_id: race.id,
          player_id: player.id,
          horse_id: horse,
          bet_type: 'win',
          amount: amounts.win,
          odds_at_time: 0,
        });
      }
      if (amounts.place > 0) {
        bets.push({
          race_id: race.id,
          player_id: player.id,
          horse_id: horse,
          bet_type: 'place',
          amount: amounts.place,
          odds_at_time: 0,
        });
      }
      if (amounts.show > 0) {
        bets.push({
          race_id: race.id,
          player_id: player.id,
          horse_id: horse,
          bet_type: 'show',
          amount: amounts.show,
          odds_at_time: 0,
        });
      }

      await Promise.all(bets.map(b => base44.entities.RaceBet.create(b)));

      // Update pools
      await base44.entities.RaceEvent.update(race.id, {
        total_win_pool: (race.total_win_pool || 0) + amounts.win,
        total_place_pool: (race.total_place_pool || 0) + amounts.place,
        total_show_pool: (race.total_show_pool || 0) + amounts.show,
      });

      // Deduct balance
      await base44.entities.Player.update(player.id, {
        points_balance: player.points_balance - totalAmount,
      });

      await base44.entities.Ledger.create({
        player_id: player.id,
        change: -totalAmount,
        reason: 'game_bet',
        balance_after: player.points_balance - totalAmount,
        note: `All 3 bets on race ${race.id.slice(0, 6)}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['myRaceBets'] });
      toast.success('All 3 bets placed!');
      setAmount('');
      setSelectedHorse('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place bets');
    },
  });

  const handleBetAll3 = () => {
    if (!selectedHorse || !amount) {
      toast.error('Select horse and amount');
      return;
    }
    const betAmount = parseFloat(amount);
    quickBetMutation.mutate({
      horse: selectedHorse,
      amounts: { win: betAmount, place: betAmount, show: betAmount },
    });
  };

  if (isOwnerInRace) {
    return (
      <Card className="bg-slate-900/50 border-orange-500/50">
        <CardHeader>
          <CardTitle className="text-white">⚠️ Owner Restriction</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-slate-400">
              You cannot bet on races where you have a horse entered.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 sticky top-4">
      <CardHeader>
        <CardTitle className="text-white">Betting Pools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pool Totals */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-green-400 text-xs font-semibold">WIN</p>
            <p className="text-white font-bold text-sm">{race.total_win_pool.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-400 text-xs font-semibold">PLACE</p>
            <p className="text-white font-bold text-sm">{race.total_place_pool.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-purple-400 text-xs font-semibold">SHOW</p>
            <p className="text-white font-bold text-sm">{race.total_show_pool.toLocaleString()}</p>
          </div>
        </div>

        {!isBettingOpen ? (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-slate-400">
              Betting is closed for this race
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Tabs value={betType} onValueChange={setBetType}>
              <TabsList className="w-full bg-slate-800/50">
                <TabsTrigger value="win" className="flex-1">Win</TabsTrigger>
                <TabsTrigger value="place" className="flex-1">Place</TabsTrigger>
                <TabsTrigger value="show" className="flex-1">Show</TabsTrigger>
              </TabsList>

              <TabsContent value={betType} className="space-y-3 mt-4">
                <div>
                  <Label className="text-slate-400 text-xs">
                    {betType === 'win' && 'Pick 1st place'}
                    {betType === 'place' && 'Pick top 2'}
                    {betType === 'show' && 'Pick top 3'}
                  </Label>
                  <select
                    value={selectedHorse}
                    onChange={(e) => setSelectedHorse(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="">Select horse...</option>
                    {entries.map((entry) => {
                      const horse = horses.find(h => h.id === entry.horse_id);
                      if (!horse) return null;
                      return (
                        <option key={horse.id} value={horse.id}>
                          {horse.avatar_emoji} {horse.horse_name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <Label className="text-slate-400 text-xs">Amount (100-50,000)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter points"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setAmount('1000')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-700"
                  >
                    1k
                  </Button>
                  <Button
                    onClick={() => setAmount('5000')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-700"
                  >
                    5k
                  </Button>
                  <Button
                    onClick={() => setAmount('10000')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-700"
                  >
                    10k
                  </Button>
                </div>

                <Button
                  onClick={() => placeBetMutation.mutate()}
                  disabled={placeBetMutation.isPending || !selectedHorse || !amount}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {placeBetMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `Place ${betType.toUpperCase()} Bet`
                  )}
                </Button>

                <Button
                  onClick={handleBetAll3}
                  disabled={quickBetMutation.isPending || !selectedHorse || !amount}
                  variant="outline"
                  className="w-full border-amber-500 text-amber-400 hover:bg-amber-500/10"
                >
                  {quickBetMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '🎯 Bet All 3 Pools'
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* My Bets */}
        {myBets.length > 0 && (
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-white font-semibold mb-3 text-sm">My Bets</h3>
            <div className="space-y-2">
              {myBets.map((bet) => {
                const horse = horses.find(h => h.id === bet.horse_id);
                return (
                  <div key={bet.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                    <div>
                      <p className="text-white font-semibold">{horse?.horse_name}</p>
                      <p className="text-slate-400">{bet.bet_type.toUpperCase()}</p>
                    </div>
                    <p className="text-amber-400 font-bold">{bet.amount.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}