import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, TrendingUp, Coins, Trophy, Zap, Plus, Minus, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import moment from 'moment';

export default function PlayerProfile() {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const playerId = params.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: currentPlayer } = useQuery({
    queryKey: ['currentPlayer', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0] || null;
    },
    enabled: !!playerId,
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['ledger', playerId],
    queryFn: () => base44.entities.Ledger.filter({ player_id: playerId }, '-created_date', 100),
    enabled: !!playerId,
  });

  const { data: gameSessions = [] } = useQuery({
    queryKey: ['gameSessions', playerId],
    queryFn: () => base44.entities.GameSession.filter({ player_id: playerId }, '-created_date', 50),
    enabled: !!playerId,
  });

  const { data: slotSessions = [] } = useQuery({
    queryKey: ['slotSessions', playerId],
    queryFn: () => base44.entities.SlotSession.filter({ player_id: playerId }, '-created_date', 50),
    enabled: !!playerId,
  });

  const { data: plinkoSessions = [] } = useQuery({
    queryKey: ['plinkoSessions', playerId],
    queryFn: () => base44.entities.PlinkoSession.filter({ player_id: playerId }, '-created_date', 50),
    enabled: !!playerId,
  });

  const allSessions = [...gameSessions, ...slotSessions, ...plinkoSessions]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 50);

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ updates, ledgerEntry }) => {
      await base44.entities.Player.update(playerId, updates);
      if (ledgerEntry) {
        await base44.entities.Ledger.create(ledgerEntry);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success('Player updated successfully');
    },
  });

  const handleAdjustPoints = async () => {
    const amount = parseInt(adjustAmount);
    if (!amount || !player) return;

    const newBalance = player.points_balance + amount;

    await updatePlayerMutation.mutateAsync({
      updates: { points_balance: newBalance },
      ledgerEntry: {
        player_id: playerId,
        change: amount,
        reason: 'admin_adjustment',
        balance_after: newBalance,
        note: adjustNote || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount}`,
      },
    });

    setAdjustDialogOpen(false);
    setAdjustAmount('');
    setAdjustNote('');
  };

  const isAdmin = currentPlayer?.is_admin || currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-white">Player not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalWagered = player.total_wagered || 0;
  const totalWon = player.total_won || 0;
  const netProfit = totalWon - totalWagered;
  const winRate = totalWagered > 0 ? ((totalWon / totalWagered) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
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
          </div>
        </div>

        {/* Player Info Card */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-3xl">
                  {player.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1">{player.display_name}</h1>
                  <p className="text-slate-400">{player.created_by}</p>
                  <p className="text-slate-500 text-sm">Member since {moment(player.created_date).format('MMM D, YYYY')}</p>
                </div>
              </div>

              {isAdmin && (
                <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold">
                      Adjust Balance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Adjust Points</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label className="text-slate-400">Current Balance</Label>
                        <p className="text-2xl font-bold text-amber-400">
                          {player.points_balance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-400">Adjustment Amount</Label>
                        <Input
                          type="number"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="Enter amount (positive or negative)"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">Note (optional)</Label>
                        <Input
                          value={adjustNote}
                          onChange={(e) => setAdjustNote(e.target.value)}
                          placeholder="Reason for adjustment"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAdjustPoints}
                          disabled={!adjustAmount || updatePlayerMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold"
                        >
                          {updatePlayerMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>Apply Adjustment</>
                          )}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustAmount('100')}
                          className="border-green-500/50 text-green-400"
                        >
                          <Plus className="w-3 h-3 mr-1" />100
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustAmount('500')}
                          className="border-green-500/50 text-green-400"
                        >
                          <Plus className="w-3 h-3 mr-1" />500
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustAmount('-100')}
                          className="border-red-500/50 text-red-400"
                        >
                          <Minus className="w-3 h-3 mr-1" />100
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-amber-400">{player.points_balance.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Level / XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-purple-400">{player.level || 1}</p>
              <p className="text-xs text-slate-500 mt-1">{player.xp || 0} XP</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Wagered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-cyan-400">{totalWagered.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Total Won
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-400">{totalWon.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Net Profit/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-blue-400">{winRate}%</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Games Played</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-pink-400">{player.games_played || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Biggest Win</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-yellow-400">{(player.biggest_win || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Game-Specific Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Slots Stats */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🎰 Slots Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Games Played</p>
                <p className="text-2xl font-bold text-purple-400">{player.slots_games_played || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Wagered</p>
                <p className="text-xl font-semibold text-purple-300">
                  {(player.slots_total_bet || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Avg Bet Per Spin</p>
                <p className="text-lg text-purple-200">
                  {player.slots_games_played > 0 
                    ? Math.round((player.slots_total_bet || 0) / player.slots_games_played) 
                    : 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Blackjack Stats */}
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🃏 Blackjack Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Games Played</p>
                <p className="text-2xl font-bold text-green-400">{player.blackjack_games_played || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Wins</p>
                <p className="text-xl font-semibold text-green-300">{player.blackjack_wins || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Win Rate</p>
                <p className="text-lg text-green-200">
                  {player.blackjack_games_played > 0 
                    ? ((player.blackjack_wins || 0) / player.blackjack_games_played * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Longest Win Streak</p>
                <p className="text-lg font-bold text-yellow-400">🔥 {player.blackjack_longest_streak || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Plinko Stats */}
          <Card className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border-orange-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                ⚪ Plinko Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Total Drops</p>
                <p className="text-2xl font-bold text-orange-400">{player.plinko_drops || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for History */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 mb-6">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-slate-700">
              Transaction History
            </TabsTrigger>
            <TabsTrigger value="games" className="data-[state=active]:bg-slate-700">
              Game History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ledgerEntries.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No transactions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400">Reason</TableHead>
                        <TableHead className="text-slate-400">Change</TableHead>
                        <TableHead className="text-slate-400">Balance After</TableHead>
                        <TableHead className="text-slate-400">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerEntries.map((entry) => (
                        <TableRow key={entry.id} className="border-slate-700">
                          <TableCell className="text-slate-300 text-sm">
                            {moment(entry.created_date).format('MMM D, YYYY h:mm A')}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <span className="capitalize">{entry.reason.replace(/_/g, ' ')}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.change >= 0 ? '+' : ''}{entry.change.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-amber-400 font-semibold">
                            {entry.balance_after.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {entry.note || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Game History</CardTitle>
              </CardHeader>
              <CardContent>
                {allSessions.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No games played yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400">Game</TableHead>
                        <TableHead className="text-slate-400">Bet</TableHead>
                        <TableHead className="text-slate-400">Result</TableHead>
                        <TableHead className="text-slate-400">Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSessions.map((session) => {
                        const gameType = session.game_type || (session.bet_per_line ? 'Slots' : 'Plinko');
                        const bet = session.bet_amount || session.total_bet || 0;
                        const payout = session.total_win || session.payout || 0;
                        const netResult = session.net_result || (payout - bet);

                        return (
                          <TableRow key={session.id} className="border-slate-700">
                            <TableCell className="text-slate-300 text-sm">
                              {moment(session.created_date).format('MMM D, h:mm A')}
                            </TableCell>
                            <TableCell className="text-slate-300 capitalize">
                              {gameType}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {bet.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold ${netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {netResult >= 0 ? '+' : ''}{netResult.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-amber-400">
                              {payout.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}