import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NumbersLotteryAdmin() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['numbersConfig'],
    queryFn: async () => {
      const configs = await base44.entities.NumbersLotteryConfig.list();
      return configs[0] || null;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        await base44.entities.NumbersLotteryConfig.update(config.id, data);
      } else {
        await base44.entities.NumbersLotteryConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbersConfig'] });
      toast.success('Config updated');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('GameSettings')}>
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game Settings
          </Button>
        </Link>

        <h1 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
          <span className="text-4xl">🎱</span>
          Numbers Lottery Settings
        </h1>

        <div className="space-y-6">
          {/* General */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Numbers Lottery</Label>
                <Switch
                  checked={config?.enabled ?? true}
                  onCheckedChange={(val) => updateConfigMutation.mutate({ ...config, enabled: val })}
                />
              </div>

              <div>
                <Label className="text-slate-300">Ticket Price (vault points)</Label>
                <p className="text-slate-500 text-xs mb-2">Cost per ticket. Higher price = bigger prizes. Recommended: 2000</p>
                <Input
                  type="number"
                  value={config?.ticket_price ?? 2000}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, ticket_price: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label>Draw Schedule</Label>
                <Select
                  value={config?.draw_schedule ?? 'weekly'}
                  onValueChange={(val) => updateConfigMutation.mutate({ ...config, draw_schedule: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Quick Pick</Label>
                <Switch
                  checked={config?.quick_pick_enabled ?? true}
                  onCheckedChange={(val) => updateConfigMutation.mutate({ ...config, quick_pick_enabled: val })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Numbers Config */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Numbers Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Main Numbers Count</Label>
                  <Input
                    type="number"
                    value={config?.main_numbers_count ?? 5}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, main_numbers_count: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>Main Min</Label>
                  <Input
                    type="number"
                    value={config?.main_numbers_min ?? 1}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, main_numbers_min: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>Main Max</Label>
                  <Input
                    type="number"
                    value={config?.main_numbers_max ?? 69}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, main_numbers_max: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Power Number Min</Label>
                  <Input
                    type="number"
                    value={config?.power_number_min ?? 1}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, power_number_min: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>Power Number Max</Label>
                  <Input
                    type="number"
                    value={config?.power_number_max ?? 26}
                    onChange={(e) => updateConfigMutation.mutate({ ...config, power_number_max: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payouts */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Payout Percentages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">5 Main + Power (%)</Label>
                <p className="text-slate-500 text-xs mb-2">Jackpot tier - matching all numbers. Should be highest. Default: 50%</p>
                <Input
                  type="number"
                  value={config?.payout_tier_5_match_percentage ?? 50}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, payout_tier_5_match_percentage: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">5 Main (%)</Label>
                <p className="text-slate-500 text-xs mb-2">Second tier - all main numbers only. Default: 10%</p>
                <Input
                  type="number"
                  value={config?.payout_tier_5_percentage ?? 10}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, payout_tier_5_percentage: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">4 Main + Power (%)</Label>
                <p className="text-slate-500 text-xs mb-2">Third tier - 4 main plus power. Default: 5%</p>
                <Input
                  type="number"
                  value={config?.payout_tier_4_power_percentage ?? 5}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, payout_tier_4_power_percentage: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">4 Main (%)</Label>
                <p className="text-slate-500 text-xs mb-2">Fourth tier - 4 main numbers only. Default: 3%</p>
                <Input
                  type="number"
                  value={config?.payout_tier_4_percentage ?? 3}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, payout_tier_4_percentage: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">3 Main + Power (%)</Label>
                <p className="text-slate-500 text-xs mb-2">Fifth tier - 3 main plus power. Most common win. Default: 2%</p>
                <Input
                  type="number"
                  value={config?.payout_tier_3_power_percentage ?? 2}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, payout_tier_3_power_percentage: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <p className="text-amber-400 text-xs pt-2 border-t border-slate-700">💡 Tip: Total percentages should add up to less than 100%. Remaining goes to house/rollover.</p>
            </CardContent>
          </Card>

          {/* Rollover & Limits */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Rollover & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Enable Rollover</Label>
                  <p className="text-slate-500 text-xs">If no jackpot winner, prize rolls to next draw. Creates excitement!</p>
                </div>
                <Switch
                  checked={config?.rollover_enabled ?? true}
                  onCheckedChange={(val) => updateConfigMutation.mutate({ ...config, rollover_enabled: val })}
                />
              </div>

              <div>
                <Label className="text-slate-300">Max Payout Cap (0 = no cap)</Label>
                <p className="text-slate-500 text-xs mb-2">Maximum total payout per draw. Set 0 for unlimited. Use to manage risk.</p>
                <Input
                  type="number"
                  value={config?.max_payout_cap ?? 0}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, max_payout_cap: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label>Max Tickets Per Player Per Draw</Label>
                <Input
                  type="number"
                  value={config?.max_tickets_per_player_per_draw ?? 100}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, max_tickets_per_player_per_draw: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label>Min Account Age (days)</Label>
                <Input
                  type="number"
                  value={config?.min_account_age_days ?? 3}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, min_account_age_days: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label>Announcement Threshold</Label>
                <Input
                  type="number"
                  value={config?.announcement_threshold ?? 50000}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, announcement_threshold: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}