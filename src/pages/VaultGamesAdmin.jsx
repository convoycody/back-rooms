import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, PlayCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function VaultGamesAdmin() {
  const [activeTab, setActiveTab] = useState('fifty-fifty');
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

  const { data: fiftyConfig, isLoading: fiftyLoading } = useQuery({
    queryKey: ['fiftyFiftyConfig'],
    queryFn: async () => {
      const configs = await base44.entities.FiftyFiftyConfig.list();
      return configs[0] || null;
    },
  });

  const { data: numbersConfig, isLoading: numbersLoading } = useQuery({
    queryKey: ['numbersConfig'],
    queryFn: async () => {
      const configs = await base44.entities.NumbersLotteryConfig.list();
      return configs[0] || null;
    },
  });

  const updateFiftyConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (fiftyConfig) {
        await base44.entities.FiftyFiftyConfig.update(fiftyConfig.id, data);
      } else {
        await base44.entities.FiftyFiftyConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiftyFiftyConfig'] });
      toast.success('50/50 config updated');
    },
  });

  const updateNumbersConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (numbersConfig) {
        await base44.entities.NumbersLotteryConfig.update(numbersConfig.id, data);
      } else {
        await base44.entities.NumbersLotteryConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbersConfig'] });
      toast.success('Numbers lottery config updated');
    },
  });

  const createPoolMutation = useMutation({
    mutationFn: async (date) => {
      const response = await base44.functions.invoke('createFiftyFiftyPool', { pool_date: date });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Pool created');
    },
  });

  const createDrawMutation = useMutation({
    mutationFn: async (date) => {
      const response = await base44.functions.invoke('createNumbersDraw', { draw_date: date });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Draw created');
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

  if (fiftyLoading || numbersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">🎰 Vault Games Admin</h1>
          <p className="text-slate-400 text-sm">Configure 50/50 Pool and Numbers Lottery</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 mb-6">
            <TabsTrigger value="fifty-fifty" className="flex-1">50/50 Pool</TabsTrigger>
            <TabsTrigger value="numbers" className="flex-1">Numbers Lottery</TabsTrigger>
          </TabsList>

          {/* 50/50 Pool Config */}
          <TabsContent value="fifty-fifty">
            <Card className="bg-slate-900/50 border-slate-700/50 mb-4">
              <CardHeader>
                <CardTitle className="text-white">50/50 Pool Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Enable 50/50 Pool</Label>
                  <Switch
                    checked={fiftyConfig?.enabled}
                    onCheckedChange={(checked) => updateFiftyConfigMutation.mutate({ ...fiftyConfig, enabled: checked })}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Ticket Price (points)</Label>
                  <Input
                    type="number"
                    value={fiftyConfig?.ticket_price || 1000}
                    onChange={(e) => updateFiftyConfigMutation.mutate({ ...fiftyConfig, ticket_price: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Cutoff Hour (ET)</Label>
                  <Input
                    type="number"
                    value={fiftyConfig?.cutoff_hour_et || 20}
                    onChange={(e) => updateFiftyConfigMutation.mutate({ ...fiftyConfig, cutoff_hour_et: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Draw Hour (ET)</Label>
                  <Input
                    type="number"
                    value={fiftyConfig?.draw_hour_et || 21}
                    onChange={(e) => updateFiftyConfigMutation.mutate({ ...fiftyConfig, draw_hour_et: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Minimum Pool Size</Label>
                  <Input
                    type="number"
                    value={fiftyConfig?.min_pool_size || 5}
                    onChange={(e) => updateFiftyConfigMutation.mutate({ ...fiftyConfig, min_pool_size: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Max Tickets Per Player Per Draw</Label>
                  <Input
                    type="number"
                    value={fiftyConfig?.max_tickets_per_player_per_draw || 100}
                    onChange={(e) => updateFiftyConfigMutation.mutate({ ...fiftyConfig, max_tickets_per_player_per_draw: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <Button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    createPoolMutation.mutate(today);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Today's Pool
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Numbers Lottery Config */}
          <TabsContent value="numbers">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Numbers Lottery Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Enable Numbers Lottery</Label>
                  <Switch
                    checked={numbersConfig?.enabled}
                    onCheckedChange={(checked) => updateNumbersConfigMutation.mutate({ ...numbersConfig, enabled: checked })}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Ticket Price (points)</Label>
                  <Input
                    type="number"
                    value={numbersConfig?.ticket_price || 2000}
                    onChange={(e) => updateNumbersConfigMutation.mutate({ ...numbersConfig, ticket_price: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Main Numbers (Pick)</Label>
                    <Input
                      type="number"
                      value={numbersConfig?.main_numbers_count || 5}
                      disabled
                      className="bg-slate-800 border-slate-700 text-white opacity-50"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Main Range</Label>
                    <Input
                      value={`${numbersConfig?.main_numbers_min || 1}-${numbersConfig?.main_numbers_max || 69}`}
                      disabled
                      className="bg-slate-800 border-slate-700 text-white opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-400">Max Tickets Per Player</Label>
                  <Input
                    type="number"
                    value={numbersConfig?.max_tickets_per_player_per_draw || 100}
                    onChange={(e) => updateNumbersConfigMutation.mutate({ ...numbersConfig, max_tickets_per_player_per_draw: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Enable Rollover</Label>
                  <Switch
                    checked={numbersConfig?.rollover_enabled}
                    onCheckedChange={(checked) => updateNumbersConfigMutation.mutate({ ...numbersConfig, rollover_enabled: checked })}
                  />
                </div>

                <Button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    createDrawMutation.mutate(today);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Today's Draw
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}