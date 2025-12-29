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
import { Loader2, ArrowLeft, Plus } from 'lucide-react';
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
          <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 mb-6">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="fees" className="flex-1">Fees & Entry</TabsTrigger>
            <TabsTrigger value="betting" className="flex-1">Betting</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
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
                  <Input
                    type="number"
                    value={config?.owner_license_cost || 50000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_license_cost: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Max Horses Per Owner</Label>
                  <Input
                    type="number"
                    value={config?.max_horses_per_owner || 3}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, max_horses_per_owner: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Race Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={config?.race_duration_seconds || 60}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, race_duration_seconds: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Momentum Impact Cap (%)</Label>
                  <Input
                    type="number"
                    value={config?.momentum_impact_cap || 8}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, momentum_impact_cap: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Minimum Pool Size</Label>
                  <Input
                    type="number"
                    value={config?.min_pool_size || 0}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, min_pool_size: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-slate-500 text-xs mt-1">Minimum total betting pool to run race (0 = no minimum, prevents low-pool manipulation)</p>
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
                  <Input
                    type="number"
                    value={config?.duel_entry_fee || 5000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, duel_entry_fee: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Sprint Entry Fee (4-horse)</Label>
                  <Input
                    type="number"
                    value={config?.sprint_entry_fee || 10000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, sprint_entry_fee: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Main Event Entry Fee (6-horse)</Label>
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
                  <Input
                    type="number"
                    value={config?.min_bet_amount || 100}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, min_bet_amount: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Maximum Bet</Label>
                  <Input
                    type="number"
                    value={config?.max_bet_amount || 50000}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, max_bet_amount: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">House Take (%)</Label>
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
                  <Input
                    type="number"
                    value={config?.owner_purse_win_percentage || 60}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_purse_win_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Place (2nd Place) %</Label>
                  <Input
                    type="number"
                    value={config?.owner_purse_place_percentage || 30}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_purse_place_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Show (3rd Place) %</Label>
                  <Input
                    type="number"
                    value={config?.owner_purse_show_percentage || 10}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, owner_purse_show_percentage: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}