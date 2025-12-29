import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Coins, RefreshCw, Plus, Minus, Gift, Shield, ArrowLeft, Settings, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function Admin() {
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const queryClient = useQueryClient();
  const [verifyingBadge, setVerifyingBadge] = useState(false);

  const { isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['allSessions'],
    queryFn: () => base44.entities.GameSession.list('-created_date', 100),
  });

  const { data: slotSessions = [] } = useQuery({
    queryKey: ['allSlotSessions'],
    queryFn: () => base44.entities.SlotSession.list('-created_date', 100),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ playerId, updates, ledgerEntry }) => {
      await base44.entities.Player.update(playerId, updates);
      if (ledgerEntry) {
        await base44.entities.Ledger.create(ledgerEntry);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      toast.success('Player updated successfully');
    },
  });

  const handleAdjustPoints = async (playerId, amount) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newBalance = player.points_balance + amount;
    
    await updatePlayerMutation.mutateAsync({
      playerId,
      updates: { points_balance: newBalance },
      ledgerEntry: {
        player_id: playerId,
        change: amount,
        reason: 'admin_adjustment',
        balance_after: newBalance,
        note: adjustNote || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount}`,
      },
    });

    setSelectedPlayer(null);
    setAdjustAmount('');
    setAdjustNote('');
  };

  const handleResetAllBalances = async () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }

    for (const player of players) {
      await updatePlayerMutation.mutateAsync({
        playerId: player.id,
        updates: { 
          points_balance: 1000,
          total_wagered: 0,
          total_won: 0,
          games_played: 0,
          biggest_win: 0,
          xp: 0,
          level: 1,
        },
        ledgerEntry: {
          player_id: player.id,
          change: 1000 - player.points_balance,
          reason: 'admin_adjustment',
          balance_after: 1000,
          note: 'Season reset',
        },
      });
    }

    setShowResetDialog(false);
    setResetConfirmText('');
    toast.success('All balances reset to 1000');
  };

  const integrationChecks = [
    { name: 'Auth API', key: 'auth', status: 'needs-live-service', description: 'Ensure /auth/me, /auth/login, /auth/logout are reachable.' },
    { name: 'Ledger & Wallet', key: 'ledger', status: 'needs-live-service', description: 'Ledger is source of truth; wallet deposit/withdraw endpoints must exist.' },
    { name: 'RNG/Provable Fairness', key: 'rng', status: 'pending', description: 'Provide /rng/seed and /rng/verify for provable results.' },
    { name: 'Audit & Telemetry', key: 'audit', status: 'wired', description: 'Functions forward to DevOps; ensure SERVICE_API_KEY + webhooks are configured.' },
    { name: 'DevOps Badge', key: 'badge', status: 'manual', description: 'Badge verification endpoint required; see Docs/Integrations.' },
  ];

  const envVars = [
    'VITE_API_BASE_URL',
    'VITE_AUTH_LOGIN_URL',
    'VITE_AUTH_LOGOUT_URL',
    'VITE_SERVICE_API_KEY',
    'DEVOPS_BASE_URL',
    'DEVOPS_API_KEY',
    'DEVOPS_APP_ID',
    'DEVOPS_APP_NAME',
    'SERVICE_API_KEY',
  ];

  const handleVerifyBadge = async () => {
    try {
      setVerifyingBadge(true);
      // Placeholder until a real badge verification endpoint exists
      toast.info('Badge verification requires a live /badge/verify endpoint on the platform API.');
    } finally {
      setVerifyingBadge(false);
    }
  };

  const handleGiveBonus = async () => {
    const bonusAmount = 100;
    
    for (const player of players) {
      await updatePlayerMutation.mutateAsync({
        playerId: player.id,
        updates: { 
          points_balance: player.points_balance + bonusAmount,
        },
        ledgerEntry: {
          player_id: player.id,
          change: bonusAmount,
          reason: 'daily_bonus',
          balance_after: player.points_balance + bonusAmount,
          note: 'Global bonus event',
        },
      });
    }

    toast.success(`Gave ${bonusAmount} points to all players`);
  };

  // Stats
  const totalPlayers = players.length;
  const totalPointsInCirculation = players.reduce((sum, p) => sum + (p.points_balance || 0), 0);
  const totalGamesPlayed = sessions.length + slotSessions.length;
  const houseProfit = sessions.reduce((sum, s) => sum + (s.points_delta < 0 ? Math.abs(s.points_delta) : 0), 0) -
                      sessions.reduce((sum, s) => sum + (s.points_delta > 0 ? s.points_delta : 0), 0);
  
  // Live/Recent activity
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const _playersLast24h = players.filter(p => new Date(p.updated_date) >= last24Hours).length;
  const playersLast7d = players.filter(p => new Date(p.updated_date) >= last7Days).length;
  
  const gamesLast24h = [...sessions, ...slotSessions].filter(s => new Date(s.created_date) >= last24Hours).length;
  const gamesLast7d = [...sessions, ...slotSessions].filter(s => new Date(s.created_date) >= last7Days).length;
  
  // Unique active players (played in last 24h)
  const activeSessions = [...sessions, ...slotSessions].filter(s => new Date(s.created_date) >= last24Hours);
  const uniqueActivePlayers = new Set(activeSessions.map(s => s.player_id)).size;
  
  // Average stats
  const avgBalance = totalPlayers > 0 ? Math.round(totalPointsInCirculation / totalPlayers) : 0;
  const avgGamesPerPlayer = totalPlayers > 0 ? (totalGamesPlayed / totalPlayers).toFixed(1) : 0;

  if (userLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(createPageUrl('Home'))} variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-amber-500" />
                Admin Panel
              </h1>
              <p className="text-slate-400">Manage players and game settings</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-white">{totalPlayers}</p>
              <p className="text-xs text-slate-500 mt-1">Avg balance: {avgBalance}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Points in Play
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-amber-400">{totalPointsInCirculation.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Games Played</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-cyan-400">{totalGamesPlayed}</p>
              <p className="text-xs text-slate-500 mt-1">Avg per player: {avgGamesPerPlayer}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">House Edge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-black ${houseProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {houseProfit >= 0 ? '+' : ''}{houseProfit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Active Now (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-400">{uniqueActivePlayers}</p>
              <p className="text-xs text-slate-500 mt-1">Unique players</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Players (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-blue-400">{playersLast7d}</p>
              <p className="text-xs text-slate-500 mt-1">Active this week</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Games (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-purple-400">{gamesLast24h}</p>
              <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Games (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-pink-400">{gamesLast7d}</p>
              <p className="text-xs text-slate-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Game Settings Card */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Configuration Dashboards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate(createPageUrl('GameSettings'))} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold">
              <Settings className="w-4 h-4 mr-2" />
              Game Settings - Per-Game Limits & Controls
            </Button>
            <p className="text-slate-400 text-xs">
              Configure min/max bets, enable/disable games, and manage game-specific settings
            </p>
            
            <Button onClick={() => navigate(createPageUrl('HouseControls'))} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
              <Settings className="w-4 h-4 mr-2" />
              Platform Settings - Economy & Bonuses
            </Button>
            <p className="text-slate-400 text-xs">
              Manage daily bonuses, referral rewards, top-ups, Noon Drop, and economy stats
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={() => navigate(createPageUrl('Moderation'))} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold">
            <Shield className="w-4 h-4 mr-2" />
            Chat Moderation
          </Button>
          <Button onClick={() => navigate(createPageUrl('ScratchersMetrics'))} className="bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold">
            🎫 Scratchers Metrics
          </Button>
          <Link to={createPageUrl('DevOpsTest')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold">
              <Zap className="w-4 h-4 mr-2" />
              DevOps Testing
            </Button>
          </Link>
          <Link to={createPageUrl('ErrorLogs')}>
            <Button className="bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold">
              🚨 Error Logs
            </Button>
          </Link>
          <Button 
            onClick={handleGiveBonus}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold"
          >
            <Gift className="w-4 h-4 mr-2" />
            Give All Players 100pts
          </Button>
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All Balances (Season Reset)
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-red-500/30">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-red-400" />
                  Reset All Player Balances
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 font-bold mb-2">⚠️ CRITICAL WARNING</p>
                  <p className="text-slate-300 text-sm">
                    This will reset ALL player balances to 1000 and clear all stats (wagered, won, games played, XP, level).
                    This action cannot be undone.
                  </p>
                </div>
                
                <div>
                  <Label className="text-slate-400 mb-2 block">
                    Type <span className="text-red-400 font-bold">RESET</span> to confirm
                  </Label>
                  <Input
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="Type RESET here"
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowResetDialog(false);
                      setResetConfirmText('');
                    }}
                    variant="outline"
                    className="flex-1 border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResetAllBalances}
                    disabled={resetConfirmText !== 'RESET' || updatePlayerMutation.isPending}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
                  >
                    {updatePlayerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Reset All Balances'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Players Table */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">All Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Player</TableHead>
                  <TableHead className="text-slate-400">Balance</TableHead>
                  <TableHead className="text-slate-400">Level</TableHead>
                  <TableHead className="text-slate-400">Games</TableHead>
                  <TableHead className="text-slate-400">Total Won</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} className="border-slate-700">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg">
                          {player.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{player.display_name}</p>
                          <p className="text-slate-500 text-sm">{player.created_by}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-amber-400 font-bold">
                      {(player.points_balance || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-purple-400">
                      {player.level || 1}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {player.games_played || 0}
                    </TableCell>
                    <TableCell className="text-green-400">
                      {(player.total_won || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={createPageUrl('PlayerProfile') + `?id=${player.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-purple-600 text-purple-400 hover:bg-purple-500/10"
                          >
                            View Profile
                          </Button>
                        </Link>
                        <Dialog open={selectedPlayer?.id === player.id} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPlayer(player)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                              Adjust
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              Adjust Points - {player.display_name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label className="text-slate-400">Current Balance</Label>
                              <p className="text-2xl font-bold text-amber-400">
                                {(player.points_balance || 0).toLocaleString()}
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
                                onClick={() => handleAdjustPoints(player.id, parseInt(adjustAmount) || 0)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Integration Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrationChecks.map((item) => (
              <div key={item.key} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-100">{item.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Env Vars for Deployments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-slate-300">
              Set these in both staging and production. Staging should point to separate API/DBs.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {envVars.map((key) => (
                <div key={key} className="text-xs px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-slate-100">
                  {key}
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-200 mt-2">
              Tip: use two branches/environments (staging vs prod) with isolated databases and secrets.
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              DevOps Badge & Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-200">
              Verify badge connection and view incoming telemetry in DevOps.
            </p>
            <Button
              disabled={verifyingBadge}
              onClick={handleVerifyBadge}
              className="w-full"
            >
              {verifyingBadge ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run badge token check
            </Button>
            <p className="text-xs text-slate-300">
              Ensure DevOps webhooks are reachable and SERVICE_API_KEY is set so functions can forward events.
            </p>
            <Link
              to={createPageUrl('DevOpsTest')}
              className="text-xs text-amber-300 hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3 rotate-180" />
              Go to DevOps test page
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
