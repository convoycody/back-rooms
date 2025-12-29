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

export default function FiftyFiftyAdmin() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['fiftyFiftyConfig'],
    queryFn: async () => {
      const configs = await base44.entities.FiftyFiftyConfig.list();
      return configs[0] || null;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        await base44.entities.FiftyFiftyConfig.update(config.id, data);
      } else {
        await base44.entities.FiftyFiftyConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiftyFiftyConfig'] });
      toast.success('Config updated');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
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
          <span className="text-4xl">🎯</span>
          50/50 Pool Settings
        </h1>

        <div className="space-y-6">
          {/* General */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable 50/50 Pool</Label>
                <Switch
                  checked={config?.enabled ?? true}
                  onCheckedChange={(val) => updateConfigMutation.mutate({ ...config, enabled: val })}
                />
              </div>

              <div>
                <Label className="text-slate-300">Ticket Price (vault points)</Label>
                <p className="text-slate-500 text-xs mb-2">Cost per entry. Players pay from vault balance.</p>
                <Input
                  type="number"
                  value={config?.ticket_price ?? 1000}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, ticket_price: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label>Pool Schedule</Label>
                <Select
                  value={config?.pool_schedule ?? 'daily'}
                  onValueChange={(val) => updateConfigMutation.mutate({ ...config, pool_schedule: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Times */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Draw Times (ET)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Sales Cutoff Hour (0-23)</Label>
                <p className="text-slate-500 text-xs mb-2">When ticket sales close (Eastern Time). Example: 20 = 8:00 PM ET</p>
                <Input
                  type="number"
                  value={config?.cutoff_hour_et ?? 20}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, cutoff_hour_et: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Draw Execution Hour (0-23)</Label>
                <p className="text-slate-500 text-xs mb-2">When winner is drawn (Eastern Time). Should be after cutoff. Example: 21 = 9:00 PM ET</p>
                <Input
                  type="number"
                  value={config?.draw_hour_et ?? 21}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, draw_hour_et: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Limits */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Limits & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Min Pool Size (tickets to execute)</Label>
                <p className="text-slate-500 text-xs mb-2">Minimum tickets needed to run draw. If not met, all tickets refunded automatically.</p>
                <Input
                  type="number"
                  value={config?.min_pool_size ?? 5}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, min_pool_size: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Max Tickets Per Player Per Draw</Label>
                <p className="text-slate-500 text-xs mb-2">Prevents single player from dominating the pool. Recommended: 100</p>
                <Input
                  type="number"
                  value={config?.max_tickets_per_player_per_draw ?? 100}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, max_tickets_per_player_per_draw: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Min Account Age (days)</Label>
                <p className="text-slate-500 text-xs mb-2">Account must be this old to participate. Prevents multi-accounting. Set 0 to disable.</p>
                <Input
                  type="number"
                  value={config?.min_account_age_days ?? 1}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, min_account_age_days: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Max Pool Payout Cap (0 = no cap)</Label>
                <p className="text-slate-500 text-xs mb-2">Maximum winner payout per draw. Set 0 for unlimited. Use to control risk.</p>
                <Input
                  type="number"
                  value={config?.max_pool_payout_cap ?? 0}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, max_pool_payout_cap: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Announcement Threshold (min win to announce)</Label>
                <p className="text-slate-500 text-xs mb-2">Minimum win amount to create public announcement. Promotes big wins.</p>
                <Input
                  type="number"
                  value={config?.announcement_threshold ?? 10000}
                  onChange={(e) => updateConfigMutation.mutate({ ...config, announcement_threshold: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* House */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">House Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">House 50% Goes To</Label>
                <p className="text-slate-500 text-xs mb-2">What happens to the platform's 50% cut. Reserve = keeps, Burn = removes from economy, Jackpot = adds to future pools.</p>
                <Select
                  value={config?.house_allocation ?? 'reserve'}
                  onValueChange={(val) => updateConfigMutation.mutate({ ...config, house_allocation: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserve">Platform Reserve</SelectItem>
                    <SelectItem value="burn">Burn (Remove)</SelectItem>
                    <SelectItem value="jackpot">Add to Jackpot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}