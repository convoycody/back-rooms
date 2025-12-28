import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
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

  const { data: settings, isLoading } = useQuery({
    queryKey: ['playerSettings', player?.id],
    queryFn: async () => {
      if (!player) return null;
      const results = await base44.entities.PlayerSettings.filter({ player_id: player.id });
      if (results.length > 0) return results[0];
      
      // Create default settings
      const newSettings = await base44.entities.PlayerSettings.create({
        player_id: player.id,
        allow_public_announcements: true,
        allow_public_receipts: true,
        allow_public_wins: true
      });
      return newSettings;
    },
    enabled: !!player,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates) => base44.entities.PlayerSettings.update(settings.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerSettings'] });
      toast.success('Settings updated');
    },
  });

  if (isLoading || !player || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-black text-white">⚙️ Settings</h1>
          <p className="text-slate-400 mt-2">Manage your privacy and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Privacy Settings */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Privacy Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Control how your information is displayed to other players
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">Show name in announcements</p>
                  <p className="text-slate-400 text-sm">Display your name when you win big (250k+)</p>
                </div>
                <Switch
                  checked={settings.allow_public_announcements}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ allow_public_announcements: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">Show name on shared receipts</p>
                  <p className="text-slate-400 text-sm">Display your name when sharing win receipts</p>
                </div>
                <Switch
                  checked={settings.allow_public_receipts}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ allow_public_receipts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">Show name in leaderboards</p>
                  <p className="text-slate-400 text-sm">Display your name and stats on public leaderboards</p>
                </div>
                <Switch
                  checked={settings.allow_public_wins}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ allow_public_wins: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Display Name</span>
                <span className="text-white">{player.display_name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Member Since</span>
                <span className="text-white">{new Date(player.created_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Referral Code</span>
                <span className="text-white font-mono">{player.referral_code}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}