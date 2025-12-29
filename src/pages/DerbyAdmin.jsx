import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Plus, Trophy, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function DerbyAdmin() {
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

  const { data: config, isLoading } = useQuery({
    queryKey: ['raceConfig'],
    queryFn: async () => {
      const configs = await base44.entities.RaceConfig.list();
      return configs[0] || null;
    },
  });

  const { data: activeRaces = [] } = useQuery({
    queryKey: ['activeRaces'],
    queryFn: () => base44.entities.RaceEvent.filter({ status: 'open' }),
  });

  const { data: allRaces = [] } = useQuery({
    queryKey: ['allRaces'],
    queryFn: () => base44.entities.RaceEvent.list('-created_date', 500),
  });

  const { data: allEntries = [] } = useQuery({
    queryKey: ['allEntries'],
    queryFn: () => base44.entities.RaceEntry.list('-created_date', 1000),
  });

  const { data: allBets = [] } = useQuery({
    queryKey: ['allBets'],
    queryFn: () => base44.entities.RaceBet.list('-created_date', 1000),
  });

  const { data: allLicenses = [] } = useQuery({
    queryKey: ['allLicenses'],
    queryFn: () => base44.entities.OwnerLicense.list(),
  });

  const { data: allHorses = [] } = useQuery({
    queryKey: ['allHorses'],
    queryFn: () => base44.entities.RaceHorse.list('-total_earnings'),
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        await base44.entities.RaceConfig.update(config.id, data);
      } else {
        await base44.entities.RaceConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raceConfig'] });
      toast.success('Config updated');
    },
  });

  const isAdmin = player?.is_admin || currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-red-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Admin privileges required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">🏇 Derby Racetrack Admin</h1>
              <p className="text-slate-400 text-sm">Configure racing system and manage events</p>
            </div>
            <Link to={createPageUrl('DerbyBreakdown')}>
              <Button variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
                📚 System Breakdown
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">Active Races</p>
              <p className="text-2xl font-bold text-white">{activeRaces.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">Owner License Cost</p>
              <p className="text-2xl font-bold text-white">{config?.owner_license_cost?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <p className="text-slate-400 text-sm">System Status</p>
              <p className={`text-2xl font-bold ${config?.derby_enabled ? 'text-green-400' : 'text-red-400'}`}>
                {config?.derby_enabled ? 'Active' : 'Disabled'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 mb-6 grid grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fees">Fees & Entry</TabsTrigger>
            <TabsTrigger value="betting">Betting</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {/* Outcome Weighting Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Outcome Weighting (Transparency)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">🎲 RNG (Randomness)</span>
                  <span className="text-amber-400 font-bold">{config?.rng_weight_percentage || 75}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">📊 Skill Rating</span>
                  <span className="text-blue-400 font-bold">{config?.skill_weight_percentage || 17}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">⚡ Momentum (Max)</span>
                  <span className="text-purple-400 font-bold">{config?.momentum_weight_percentage || 8}%</span>
                </div>
                <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-700">
                  These percentages show how each factor contributes to race outcomes. RNG ensures fairness, skill rewards performance, momentum rewards engagement.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Enable Derby System</Label>
                  <Switch
                    checked={config?.derby_enabled}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ ...config, derby_enabled: checked })}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Owner License Cost (points)</Label>
                  <p className="text-slate-500 text-xs mb-2">One-time fee to become horse owner. Higher = more exclusive. Default: 50,000</p>
                  <Input
                    type="number"
                    value={config?.owner_license_cost || 50000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_license_cost: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Max Horses Per Owner</Label>
                  <p className="text-slate-500 text-xs mb-2">Maximum horses one owner can have at once. Prevents monopolies. Default: 3</p>
                  <Input
                    type="number"
                    value={config?.max_horses_per_owner || 3}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, max_horses_per_owner: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Race Duration (seconds)</Label>
                  <p className="text-slate-500 text-xs mb-2">How long race animation runs. Affects momentum submission window. Default: 60s</p>
                  <Input
                    type="number"
                    value={config?.race_duration_seconds || 60}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, race_duration_seconds: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Momentum Impact Cap (%)</Label>
                  <p className="text-slate-500 text-xs mb-2">Maximum influence momentum can have on outcome. Keeps RNG dominant. Default: 8%</p>
                  <Input
                    type="number"
                    value={config?.momentum_impact_cap || 8}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, momentum_impact_cap: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Minimum Pool Size (Total Betting Pool)</Label>
                  <p className="text-slate-500 text-xs mb-2">Minimum combined betting pool (Win + Place + Show) needed to complete race. Prevents manipulation in low-bet scenarios. Set 0 to disable. Recommended: 1000+</p>
                  <Input
                    type="number"
                    value={config?.min_pool_size || 0}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, min_pool_size: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees & Entry */}
          <TabsContent value="fees">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Entry Fees by Race Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Duel Entry Fee (2-horse)</Label>
                  <p className="text-slate-500 text-xs mb-2">Cost for owners to enter 2-horse duel. Forms owner purse. Lower tier. Default: 5,000</p>
                  <Input
                    type="number"
                    value={config?.duel_entry_fee || 5000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, duel_entry_fee: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Sprint Entry Fee (4-horse)</Label>
                  <p className="text-slate-500 text-xs mb-2">Cost for owners to enter 4-horse sprint. Mid tier. Default: 10,000</p>
                  <Input
                    type="number"
                    value={config?.sprint_entry_fee || 10000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, sprint_entry_fee: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Main Event Entry Fee (6-horse)</Label>
                  <p className="text-slate-500 text-xs mb-2">Cost for owners to enter 6-horse main event. Highest tier, biggest purses. Default: 20,000</p>
                  <Input
                    type="number"
                    value={config?.main_event_entry_fee || 20000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, main_event_entry_fee: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Betting Settings */}
          <TabsContent value="betting">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Betting Limits & House Take</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Minimum Bet</Label>
                  <p className="text-slate-500 text-xs mb-2">Smallest bet allowed per wager. Prevents micro-betting spam. Default: 100</p>
                  <Input
                    type="number"
                    value={config?.min_bet_amount || 100}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, min_bet_amount: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Maximum Bet</Label>
                  <p className="text-slate-500 text-xs mb-2">Largest bet allowed per wager. Prevents whales from dominating pools. Default: 50,000</p>
                  <Input
                    type="number"
                    value={config?.max_bet_amount || 50000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, max_bet_amount: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">House Take (%)</Label>
                  <p className="text-slate-500 text-xs mb-2">Platform cut from spectator betting pools before payouts. Standard: 10%</p>
                  <Input
                    type="number"
                    value={config?.house_take_percentage || 10}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, house_take_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout Settings */}
          <TabsContent value="payouts">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Owner Purse Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Win (1st Place) %</Label>
                  <p className="text-slate-500 text-xs mb-2">Percentage of total owner purse for 1st place. Default: 60%</p>
                  <Input
                    type="number"
                    value={config?.owner_purse_win_percentage || 60}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_purse_win_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Place (2nd Place) %</Label>
                  <p className="text-slate-500 text-xs mb-2">Percentage of total owner purse for 2nd place. Default: 30%</p>
                  <Input
                    type="number"
                    value={config?.owner_purse_place_percentage || 30}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_purse_place_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Show (3rd Place) %</Label>
                  <p className="text-slate-500 text-xs mb-2">Percentage of total owner purse for 3rd place. Default: 10%</p>
                  <Input
                    type="number"
                    value={config?.owner_purse_show_percentage || 10}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_purse_show_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <p className="text-amber-400 text-xs pt-2 border-t border-slate-700">💡 Tip: Total should equal 100%. This splits entry fees among top 3 finishers.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics & Economics */}
          <TabsContent value="metrics" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <p className="text-slate-400 text-xs">Total Races</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{allRaces.length}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Completed: {allRaces.filter(r => r.status === 'completed').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <p className="text-slate-400 text-xs">Total Purse Paid</p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {allEntries.reduce((sum, e) => sum + (e.payout || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Owner earnings</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <p className="text-slate-400 text-xs">Total Betting Volume</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {allBets.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Spectator wagers</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-400 text-xs">House Take</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">
                    {Math.floor(allBets.reduce((sum, b) => sum + (b.amount || 0), 0) * ((config?.house_take_percentage || 10) / 100)).toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{config?.house_take_percentage || 10}% of bets</p>
                </CardContent>
              </Card>
            </div>

            {/* Owner Stats */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Owner Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Total Licenses</p>
                    <p className="text-2xl font-bold text-white">{allLicenses.length}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Active: {allLicenses.filter(l => l.active).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Active Horses</p>
                    <p className="text-2xl font-bold text-white">
                      {allHorses.filter(h => !h.retired).length}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Retired: {allHorses.filter(h => h.retired).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">License Revenue</p>
                    <p className="text-2xl font-bold text-green-400">
                      {allLicenses.reduce((sum, l) => sum + (l.cost_paid || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">From licenses sold</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Horses */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🐴 Top Performing Horses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allHorses.slice(0, 10).map((horse, idx) => (
                    <div key={horse.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <div>
                          <p className="text-white font-bold">{horse.horse_name}</p>
                          <p className="text-slate-400 text-xs">
                            {horse.wins}W • {horse.places}P • {horse.shows}S • {horse.races_entered} races
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">{horse.total_earnings?.toLocaleString() || 0}</p>
                        <p className="text-slate-500 text-xs">earnings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Betting Analytics */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Betting Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Win Bets</p>
                    <p className="text-2xl font-bold text-white">
                      {allBets.filter(b => b.bet_type === 'win').length}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {allBets.filter(b => b.bet_type === 'win').reduce((sum, b) => sum + b.amount, 0).toLocaleString()} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Place Bets</p>
                    <p className="text-2xl font-bold text-white">
                      {allBets.filter(b => b.bet_type === 'place').length}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {allBets.filter(b => b.bet_type === 'place').reduce((sum, b) => sum + b.amount, 0).toLocaleString()} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Show Bets</p>
                    <p className="text-2xl font-bold text-white">
                      {allBets.filter(b => b.bet_type === 'show').length}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {allBets.filter(b => b.bet_type === 'show').reduce((sum, b) => sum + b.amount, 0).toLocaleString()} pts
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Winning Bets</p>
                    <p className="text-xl font-bold text-green-400">
                      {allBets.filter(b => b.status === 'won').length}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Paid: {allBets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.payout || 0), 0).toLocaleString()} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Losing Bets</p>
                    <p className="text-xl font-bold text-red-400">
                      {allBets.filter(b => b.status === 'lost').length}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      House kept: {allBets.filter(b => b.status === 'lost').reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()} pts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Owners */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  👑 Top Owners by Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allLicenses
                    .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
                    .slice(0, 10)
                    .map((license, idx) => (
                      <div key={license.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                          <div>
                            <p className="text-white font-bold">Owner #{license.player_id?.slice(0, 8)}</p>
                            <p className="text-slate-400 text-xs">
                              {license.total_wins}W • {license.total_races_entered} races
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-bold">{license.total_earnings?.toLocaleString() || 0}</p>
                          <p className="text-slate-500 text-xs">total earnings</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}