import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, TrendingUp, TrendingDown, Users, Coins, Trophy, Clock, CheckCircle2, XCircle, ArrowLeft, Gift, Fuel } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { toast } from 'sonner';

export default function HouseControls() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: houseConfig, isLoading: configLoading } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0] || null;
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list('-total_won'),
  });

  const { data: slotSessions = [] } = useQuery({
    queryKey: ['recentSlotSessions'],
    queryFn: () => base44.entities.SlotSession.list('-created_date', 100),
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['ledgerEntries'],
    queryFn: () => base44.entities.Ledger.list('-created_date', 500),
  });

  const { data: pendingPurchases = [] } = useQuery({
    queryKey: ['pendingPurchases'],
    queryFn: () => base44.entities.PointsPurchase.filter({ status: 'pending' }, '-created_date'),
  });

  const { data: packs = [] } = useQuery({
    queryKey: ['pointsPacks'],
    queryFn: () => base44.entities.PointsPack.list('sort_order'),
  });

  const { data: allReferrals = [] } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date'),
  });

  const { data: noonDropDraws = [] } = useQuery({
    queryKey: ['noonDropDraws'],
    queryFn: () => base44.entities.NoonDropDraw.list('-draw_time', 50),
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates) => {
      await base44.entities.HouseConfig.update(houseConfig.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houseConfig'] });
      toast.success('Settings updated');
    },
  });

  const approvePurchaseMutation = useMutation({
    mutationFn: async ({ purchaseId, approved, note }) => {
      const purchase = pendingPurchases.find(p => p.id === purchaseId);
      
      await base44.entities.PointsPurchase.update(purchaseId, {
        status: approved ? 'approved' : 'rejected',
        approved_by: currentUser.email,
        admin_note: note,
        processed_date: new Date().toISOString()
      });

      if (approved) {
        // Credit player
        const player = players.find(p => p.id === purchase.player_id);
        const newBalance = player.points_balance + purchase.points_amount;
        
        await base44.entities.Player.update(player.id, {
          points_balance: newBalance
        });

        await base44.entities.Ledger.create({
          player_id: player.id,
          change: purchase.points_amount,
          reason: 'pack_purchase',
          balance_after: newBalance,
          note: `Pack approved by admin`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      toast.success('Purchase processed');
    },
  });

  // Calculate stats
  const totalPointsInCirculation = players.reduce((sum, p) => sum + (p.points_balance || 0), 0);
  const totalWagered = ledgerEntries.filter(e => e.reason === 'slot_bet').reduce((sum, e) => sum + Math.abs(e.change), 0);
  const totalPaidOut = ledgerEntries.filter(e => e.reason === 'slot_payout').reduce((sum, e) => sum + e.change, 0);
  const houseNet = totalWagered - totalPaidOut;
  const actualRTP = totalWagered > 0 ? ((totalPaidOut / totalWagered) * 100).toFixed(2) : 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySessions = slotSessions.filter(s => new Date(s.created_date) >= todayStart);
  const todayWagered = todaySessions.reduce((sum, s) => sum + s.total_bet, 0);
  const todayPaidOut = todaySessions.reduce((sum, s) => sum + s.total_win, 0);
  const todayNet = todayWagered - todayPaidOut;

  // Bonus stats
  const todayBonuses = ledgerEntries.filter(e => {
    const entryDate = new Date(e.created_date);
    return entryDate >= todayStart && e.reason === 'daily_bonus';
  });
  const todayBonusTotal = todayBonuses.reduce((sum, e) => sum + e.change, 0);
  const todayBonusClaims = todayBonuses.length;

  const todayTopUps = ledgerEntries.filter(e => {
    const entryDate = new Date(e.created_date);
    return entryDate >= todayStart && e.reason === 'auto_topup';
  });
  const todayTopUpTotal = todayTopUps.reduce((sum, e) => sum + e.change, 0);

  const totalIssued = ledgerEntries.filter(e => e.change > 0).reduce((sum, e) => sum + e.change, 0);
  const totalBurned = ledgerEntries.filter(e => e.change < 0).reduce((sum, e) => sum + Math.abs(e.change), 0);

  if (configLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!houseConfig) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-700 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Initialize House Config</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">No house configuration found. Create one to get started.</p>
            <Button
              onClick={async () => {
                await base44.entities.HouseConfig.create({
                  slots_enabled: true,
                  min_bet_per_line: 1,
                  max_bet_per_line: 100,
                  target_rtp: 96.5,
                  volatility: 0.5,
                  jackpot_enabled: true,
                  jackpot_contribution_pct: 1,
                  jackpot_pool: 0,
                  daily_stipend_amount: 100,
                  daily_stipend_enabled: true
                });
                queryClient.invalidateQueries({ queryKey: ['houseConfig'] });
              }}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              Create House Config
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Admin')}>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-purple-500" />
                House Controls
              </h1>
              <p className="text-slate-400">Manage game settings and economy</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="controls" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="controls">Game Settings</TabsTrigger>
            <TabsTrigger value="bonuses">Daily Bonuses</TabsTrigger>
            <TabsTrigger value="noondrop">Noon Drop</TabsTrigger>
            <TabsTrigger value="referrals">Referral System</TabsTrigger>
            <TabsTrigger value="economy">Economy Stats</TabsTrigger>
            <TabsTrigger value="purchases">Pack Requests ({pendingPurchases.length})</TabsTrigger>
          </TabsList>

          {/* Referral System Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Stats */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Referral Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Referrals</p>
                      <p className="text-2xl font-bold text-white">{allReferrals.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Completed</p>
                      <p className="text-2xl font-bold text-green-400">
                        {allReferrals.filter(r => r.status === 'completed').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Pending</p>
                      <p className="text-2xl font-bold text-amber-400">
                        {allReferrals.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Total Paid</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {allReferrals.reduce((sum, r) => sum + (r.referrer_bonus || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    Referral Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Referral System Enabled</Label>
                      <p className="text-slate-400 text-sm">Master toggle for referrals</p>
                    </div>
                    <Switch
                      checked={houseConfig.referral_enabled}
                      onCheckedChange={(checked) => updateConfigMutation.mutate({ referral_enabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* New User Bonus */}
              <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50">
                <CardHeader>
                  <CardTitle className="text-white">New User Bonus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Bonus for Referred User: {houseConfig.referral_new_user_bonus?.toLocaleString() || 0}</Label>
                    <p className="text-slate-400 text-xs mb-2">Points given on signup</p>
                    <Slider
                      value={[houseConfig.referral_new_user_bonus || 15000]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ referral_new_user_bonus: val })}
                      min={0}
                      max={50000}
                      step={1000}
                      disabled={!houseConfig.referral_enabled}
                      className="mt-2"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Today's Signups</p>
                    <p className="text-green-400 font-bold text-xl">
                      {allReferrals.filter(r => {
                        const created = new Date(r.created_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return created >= today;
                      }).length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Referrer Bonus */}
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Referrer Reward</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Bonus for Inviter: {houseConfig.referral_inviter_bonus?.toLocaleString() || 0}</Label>
                    <p className="text-slate-400 text-xs mb-2">Points given after qualification</p>
                    <Slider
                      value={[houseConfig.referral_inviter_bonus || 25000]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ referral_inviter_bonus: val })}
                      min={0}
                      max={100000}
                      step={1000}
                      disabled={!houseConfig.referral_enabled}
                      className="mt-2"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Completed Today</p>
                    <p className="text-purple-400 font-bold text-xl">
                      {allReferrals.filter(r => {
                        if (!r.updated_date || r.status !== 'completed') return false;
                        const updated = new Date(r.updated_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return updated >= today;
                      }).length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Qualification */}
              <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Qualification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Minimum Games: {houseConfig.referral_min_spins || 10}</Label>
                    <p className="text-slate-400 text-xs mb-2">Games before referrer gets bonus</p>
                    <Slider
                      value={[houseConfig.referral_min_spins || 10]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ referral_min_spins: val })}
                      min={1}
                      max={100}
                      step={1}
                      disabled={!houseConfig.referral_enabled}
                      className="mt-2"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Avg Games to Complete</p>
                    <p className="text-amber-400 font-bold text-xl">
                      {allReferrals.filter(r => r.status === 'completed').length > 0
                        ? Math.round(
                            allReferrals
                              .filter(r => r.status === 'completed')
                              .reduce((sum, r) => sum + (r.referee_games_played || 0), 0) /
                            allReferrals.filter(r => r.status === 'completed').length
                          )
                        : 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Noon Drop Tab */}
          <TabsContent value="noondrop" className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border-amber-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  The Noon Drop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                  <p className="text-amber-200 text-sm">
                    <strong>How it works:</strong> Every day at 12:00 PM Eastern Time, one random eligible player wins 1,000,000 points. Fully automated, provably fair, and transparent.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Noon Drop Enabled</Label>
                    <p className="text-slate-400 text-sm">Daily random jackpot draw</p>
                  </div>
                  <Switch
                    checked={houseConfig.noon_drop_enabled}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ noon_drop_enabled: checked })}
                  />
                </div>

                <div>
                  <Label className="text-white">Prize Amount: {houseConfig.noon_drop_prize?.toLocaleString() || 1000000}</Label>
                  <p className="text-slate-400 text-xs mb-2">Fixed at 1,000,000 for fairness</p>
                  <div className="text-amber-400 text-sm font-bold mt-2">
                    {houseConfig.noon_drop_prize?.toLocaleString() || 1000000} points
                  </div>
                </div>

                <div>
                  <Label className="text-white">Eligibility Window: {houseConfig.noon_drop_eligibility_days || 7} days</Label>
                  <p className="text-slate-400 text-xs mb-2">Players must have been active within this period</p>
                  <Slider
                    value={[houseConfig.noon_drop_eligibility_days || 7]}
                    onValueChange={([val]) => updateConfigMutation.mutate({ noon_drop_eligibility_days: val })}
                    min={1}
                    max={30}
                    step={1}
                    disabled={!houseConfig.noon_drop_enabled}
                    className="mt-2"
                  />
                </div>

                <div className="pt-4 border-t border-amber-700/30">
                  <p className="text-slate-400 text-sm mb-2">Test Noon Drop</p>
                  <Button
                    onClick={async () => {
                      try {
                        const result = await base44.functions.invoke('executeNoonDrop', { 
                          manual_override: true,
                          test_mode: true 
                        });
                        toast.success(`Winner: ${result.data.winner.display_name} won ${result.data.draw.prize_amount.toLocaleString()} points!`);
                        queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
                      } catch (err) {
                        toast.error(err.response?.data?.error || 'Test failed');
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Run Test Draw Now
                  </Button>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-300 font-semibold mb-2">⚠️ Important Notes</p>
                  <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                    <li>Prize is fixed at 1M for trust & fairness</li>
                    <li>Draw uses provably fair RNG</li>
                    <li>No admin influence on winner selection</li>
                    <li>All draws are logged and auditable</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Noon Drop History */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Noon Drop History</CardTitle>
              </CardHeader>
              <CardContent>
                {noonDropDraws.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No draws yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400">Winner</TableHead>
                        <TableHead className="text-slate-400">Prize</TableHead>
                        <TableHead className="text-slate-400">Eligible</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Seed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noonDropDraws.map((draw) => (
                        <TableRow key={draw.id} className="border-slate-700">
                          <TableCell className="text-slate-400 text-sm">
                            {moment(draw.draw_time).format('MMM DD, YYYY')}
                          </TableCell>
                          <TableCell className="text-white">
                            {draw.winner_display_name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-amber-400 font-bold">
                            {draw.prize_amount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {draw.eligible_player_count || 0} players
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={draw.status === 'executed' ? 'default' : draw.status === 'failed' ? 'destructive' : 'secondary'}
                              className={
                                draw.status === 'executed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : draw.status === 'failed' 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : ''
                              }
                            >
                              {draw.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                              {draw.seed_hash?.substring(0, 12)}...
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Bonuses Tab */}
          <TabsContent value="bonuses" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Bonus */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    Daily Bonus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Daily Bonus Enabled</Label>
                      <p className="text-slate-400 text-sm">Players can claim once per day</p>
                    </div>
                    <Switch
                      checked={houseConfig.daily_bonus_enabled}
                      onCheckedChange={(checked) => updateConfigMutation.mutate({ daily_bonus_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Bonus Amount: {houseConfig.daily_bonus_amount?.toLocaleString()}</Label>
                    <Slider
                      value={[houseConfig.daily_bonus_amount || 10000]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ daily_bonus_amount: val })}
                      min={1000}
                      max={50000}
                      step={1000}
                      disabled={!houseConfig.daily_bonus_enabled}
                      className="mt-2"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Today's Stats</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Claims:</span>
                        <span className="text-white font-bold">{todayBonusClaims}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Total Paid:</span>
                        <span className="text-purple-400 font-bold">{todayBonusTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top-Up System */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-amber-400" />
                    Auto Top-Up
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Top-Up Enabled</Label>
                      <p className="text-slate-400 text-sm">Emergency balance refills</p>
                    </div>
                    <Switch
                      checked={houseConfig.topup_enabled}
                      onCheckedChange={(checked) => updateConfigMutation.mutate({ topup_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Threshold: {houseConfig.topup_threshold}</Label>
                    <Slider
                      value={[houseConfig.topup_threshold || 10]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ topup_threshold: val })}
                      min={1}
                      max={100}
                      step={1}
                      disabled={!houseConfig.topup_enabled}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Top-Up Amount: {houseConfig.topup_amount}</Label>
                    <Slider
                      value={[houseConfig.topup_amount || 500]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ topup_amount: val })}
                      min={100}
                      max={2000}
                      step={100}
                      disabled={!houseConfig.topup_enabled}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Max Per Day: {houseConfig.topup_max_per_day}</Label>
                    <Slider
                      value={[houseConfig.topup_max_per_day || 3]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ topup_max_per_day: val })}
                      min={1}
                      max={10}
                      step={1}
                      disabled={!houseConfig.topup_enabled}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Cooldown (min): {houseConfig.topup_cooldown_minutes}</Label>
                    <Slider
                      value={[houseConfig.topup_cooldown_minutes || 30]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ topup_cooldown_minutes: val })}
                      min={5}
                      max={120}
                      step={5}
                      disabled={!houseConfig.topup_enabled}
                      className="mt-2"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Today's Top-Ups</p>
                    <p className="text-amber-400 font-bold text-xl">{todayTopUpTotal.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Game Controls */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Basic Controls */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Game Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Slots Enabled</Label>
                      <p className="text-slate-400 text-sm">Master toggle for slots game</p>
                    </div>
                    <Switch
                      checked={houseConfig.slots_enabled}
                      onCheckedChange={(checked) => updateConfigMutation.mutate({ slots_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Min Bet Per Line: {houseConfig.min_bet_per_line}</Label>
                    <Slider
                      value={[houseConfig.min_bet_per_line]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ min_bet_per_line: val })}
                      min={1}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Max Bet Per Line: {houseConfig.max_bet_per_line}</Label>
                    <Slider
                      value={[houseConfig.max_bet_per_line]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ max_bet_per_line: val })}
                      min={10}
                      max={500}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Show MAX Bet Button</Label>
                      <p className="text-slate-400 text-sm">Display MAX button in games</p>
                    </div>
                    <Switch
                      checked={houseConfig.max_bet_button_enabled}
                      onCheckedChange={(checked) => updateConfigMutation.mutate({ max_bet_button_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Target RTP: {houseConfig.target_rtp}%</Label>
                    <p className="text-slate-500 text-xs mb-2">Display only - actual RTP: {actualRTP}%</p>
                    <Slider
                      value={[houseConfig.target_rtp]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ target_rtp: val })}
                      min={85}
                      max={99}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Jackpot Settings */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Jackpot Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Jackpot Enabled</Label>
                      <p className="text-slate-400 text-sm">Progressive jackpot feature</p>
                    </div>
                    <Switch
                      checked={houseConfig.jackpot_enabled}
                      onCheckedChange={(checked) => updateConfigMutation.mutate({ jackpot_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Contribution: {houseConfig.jackpot_contribution_pct}%</Label>
                    <Slider
                      value={[houseConfig.jackpot_contribution_pct]}
                      onValueChange={([val]) => updateConfigMutation.mutate({ jackpot_contribution_pct: val })}
                      min={0.5}
                      max={5}
                      step={0.5}
                      disabled={!houseConfig.jackpot_enabled}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Current Jackpot Pool</Label>
                    <p className="text-3xl font-black text-amber-400 mt-2">
                      {(houseConfig.jackpot_pool || 0).toLocaleString()} pts
                    </p>
                  </div>

                  <div>
                    <Label className="text-white">Manual Adjustment</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        id="jackpotAdjust"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('jackpotAdjust');
                          const amount = parseInt(input.value) || 0;
                          updateConfigMutation.mutate({ 
                            jackpot_pool: Math.max(0, houseConfig.jackpot_pool + amount)
                          });
                          input.value = '';
                        }}
                        variant="outline"
                        className="border-purple-500/50 text-purple-400"
                      >
                        Adjust
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Economy Stats */}
          <TabsContent value="economy" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    In Circulation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-purple-400">{totalPointsInCirculation.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Lifetime Wagered</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-cyan-400">{totalWagered.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Lifetime Paid Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-green-400">{totalPaidOut.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    {houseNet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    House Net
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-black ${houseNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {houseNet >= 0 ? '+' : ''}{houseNet.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Today Wagered</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-white">{todayWagered.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Today Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-white">{todayPaidOut.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Today Net</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-black ${todayNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {todayNet >= 0 ? '+' : ''}{todayNet.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Actual RTP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-amber-400">{actualRTP}%</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Daily Bonuses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-purple-400">{todayBonusTotal.toLocaleString()}</p>
                  <p className="text-slate-500 text-xs mt-1">{todayBonusClaims} claims</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Total Issued</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-green-400">{totalIssued.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Total Burned</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-black text-red-400">{totalBurned.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Spins */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Recent Slot Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Time</TableHead>
                      <TableHead className="text-slate-400">Player</TableHead>
                      <TableHead className="text-slate-400">Bet</TableHead>
                      <TableHead className="text-slate-400">Win</TableHead>
                      <TableHead className="text-slate-400">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slotSessions.slice(0, 20).map((session) => {
                      const player = players.find(p => p.id === session.player_id);
                      return (
                        <TableRow key={session.id} className="border-slate-700">
                          <TableCell className="text-slate-400 text-sm">
                            {moment(session.created_date).fromNow()}
                          </TableCell>
                          <TableCell className="text-white">{player?.display_name || 'Unknown'}</TableCell>
                          <TableCell className="text-slate-300">{session.total_bet}</TableCell>
                          <TableCell className="text-green-400">{session.total_win}</TableCell>
                          <TableCell className={session.net_result >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {session.net_result >= 0 ? '+' : ''}{session.net_result}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pack Requests */}
          <TabsContent value="purchases">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Pending Pack Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingPurchases.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Player</TableHead>
                        <TableHead className="text-slate-400">Pack</TableHead>
                        <TableHead className="text-slate-400">Amount</TableHead>
                        <TableHead className="text-slate-400">Requested</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPurchases.map((purchase) => {
                        const player = players.find(p => p.id === purchase.player_id);
                        const pack = packs.find(p => p.id === purchase.pack_id);
                        return (
                          <TableRow key={purchase.id} className="border-slate-700">
                            <TableCell>
                              <div>
                                <p className="text-white font-medium">{player?.display_name}</p>
                                <p className="text-slate-500 text-xs">{player?.created_by}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{pack?.name || 'Unknown'}</TableCell>
                            <TableCell className="text-purple-400 font-bold">
                              {purchase.points_amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {moment(purchase.created_date).fromNow()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approvePurchaseMutation.mutate({
                                    purchaseId: purchase.id,
                                    approved: true,
                                    note: 'Approved'
                                  })}
                                  disabled={approvePurchaseMutation.isPending}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approvePurchaseMutation.mutate({
                                    purchaseId: purchase.id,
                                    approved: false,
                                    note: 'Denied'
                                  })}
                                  disabled={approvePurchaseMutation.isPending}
                                  className="border-red-500/50 text-red-400"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
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

          <TabsContent value="scratchers">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Scratchers Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Scratchers Enabled</p>
                    <p className="text-slate-400 text-sm">Master toggle for scratch cards</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.scratchers_enabled}
                    onChange={(e) => updateConfig.mutate({ scratchers_enabled: e.target.checked })}
                    className="w-12 h-6"
                  />
                </div>

                <div>
                  <label className="text-white font-medium block mb-2">Card Cost</label>
                  <input
                    type="number"
                    value={config?.scratchers_cost || 1000}
                    onChange={(e) => updateConfig.mutate({ scratchers_cost: parseInt(e.target.value) || 1000 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-white font-medium block mb-2">Announcement Threshold</label>
                  <p className="text-slate-400 text-sm mb-2">Minimum win to create announcement</p>
                  <input
                    type="number"
                    value={config?.announcement_threshold || 250000}
                    onChange={(e) => updateConfig.mutate({ announcement_threshold: parseInt(e.target.value) || 250000 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={() => navigate(createPageUrl('ScratchersMetrics'))} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    View Scratchers Metrics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}