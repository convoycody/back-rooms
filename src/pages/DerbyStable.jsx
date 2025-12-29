import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DerbyStable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [showHorseDialog, setShowHorseDialog] = useState(false);
  const [horseName, setHorseName] = useState('');
  const [horseEmoji, setHorseEmoji] = useState('🐴');

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

  const { data: config } = useQuery({
    queryKey: ['raceConfig'],
    queryFn: async () => {
      const configs = await base44.entities.RaceConfig.list();
      return configs[0];
    },
  });

  const { data: license } = useQuery({
    queryKey: ['ownerLicense', player?.id],
    queryFn: async () => {
      if (!player) return null;
      const licenses = await base44.entities.OwnerLicense.filter({ player_id: player.id, active: true });
      return licenses[0] || null;
    },
    enabled: !!player,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['myHorses', player?.id],
    queryFn: () => base44.entities.RaceHorse.filter({ owner_id: player.id, retired: false }),
    enabled: !!player && !!license,
  });

  const purchaseLicenseMutation = useMutation({
    mutationFn: async () => {
      const cost = config.owner_license_cost || 50000;
      if (player.points_balance < cost) {
        throw new Error('Insufficient balance');
      }

      await base44.entities.OwnerLicense.create({
        player_id: player.id,
        license_type: 'lifetime',
        cost_paid: cost,
        active: true,
      });

      await base44.entities.Player.update(player.id, {
        points_balance: player.points_balance - cost,
      });

      await base44.entities.Ledger.create({
        player_id: player.id,
        change: -cost,
        reason: 'pack_purchase',
        balance_after: player.points_balance - cost,
        note: 'Derby owner license',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerLicense'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast.success('Owner license purchased!');
      setShowLicenseDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to purchase license');
    },
  });

  const createHorseMutation = useMutation({
    mutationFn: async () => {
      if (!horseName.trim()) throw new Error('Enter horse name');
      if (horses.length >= (config.max_horses_per_owner || 3)) {
        throw new Error('Maximum horses reached');
      }

      await base44.entities.RaceHorse.create({
        owner_id: player.id,
        horse_name: horseName.trim(),
        avatar_emoji: horseEmoji,
        skill_rating: 1000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHorses'] });
      toast.success('Horse created!');
      setShowHorseDialog(false);
      setHorseName('');
      setHorseEmoji('🐴');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create horse');
    },
  });

  if (!player || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const emojis = ['🐴', '🐎', '🦄', '🦓', '⚡', '🔥', '💨', '⭐'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('DerbyLobby'))}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2">👑 My Stable</h1>
          <p className="text-slate-400">Manage your horses and racing career</p>
        </motion.div>

        {!license ? (
          <Card className="bg-slate-900/50 border-amber-500/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
                👑
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Become a Horse Owner</h2>
              <p className="text-slate-400 mb-6">
                Purchase an owner license to enter horses in races and compete for purse money
              </p>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <p className="text-slate-400 text-sm">License Cost</p>
                <p className="text-3xl font-black text-amber-400">{config.owner_license_cost.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">points</p>
              </div>
              <Button
                onClick={() => setShowLicenseDialog(true)}
                disabled={player.points_balance < config.owner_license_cost}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                Purchase License
              </Button>
              {player.points_balance < config.owner_license_cost && (
                <p className="text-red-400 text-sm mt-2">Insufficient balance</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* License Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">Total Races</p>
                  <p className="text-2xl font-bold text-white">{license.total_races_entered}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">Wins</p>
                  <p className="text-2xl font-bold text-green-400">{license.total_wins}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-amber-400">{license.total_earnings.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Horses */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">My Horses</CardTitle>
                  <Button
                    onClick={() => setShowHorseDialog(true)}
                    disabled={horses.length >= config.max_horses_per_owner}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Horse
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {horses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 mb-4">No horses yet</p>
                    <Button onClick={() => setShowHorseDialog(true)} variant="outline">
                      Create Your First Horse
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {horses.map((horse) => (
                      <Card key={horse.id} className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl">
                              {horse.avatar_emoji}
                            </div>
                            <div>
                              <p className="text-white font-bold">{horse.horse_name}</p>
                              <p className="text-slate-400 text-sm">Rating: {horse.skill_rating}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-slate-700/50 rounded p-2 text-center">
                              <p className="text-slate-400">Races</p>
                              <p className="text-white font-bold">{horse.races_entered}</p>
                            </div>
                            <div className="bg-slate-700/50 rounded p-2 text-center">
                              <p className="text-slate-400">Wins</p>
                              <p className="text-green-400 font-bold">{horse.wins}</p>
                            </div>
                            <div className="bg-slate-700/50 rounded p-2 text-center">
                              <p className="text-slate-400">Earnings</p>
                              <p className="text-amber-400 font-bold">{horse.total_earnings.toLocaleString()}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(createPageUrl('DerbyEnter') + `?horse=${horse.id}`)}
                            className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            size="sm"
                          >
                            Enter Race
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Purchase License Dialog */}
        <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Purchase Owner License</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-400">
                Cost: <span className="text-amber-400 font-bold">{config.owner_license_cost.toLocaleString()} points</span>
              </p>
              <p className="text-slate-400 text-sm">
                Your balance: {player.points_balance.toLocaleString()} points
              </p>
              <Button
                onClick={() => purchaseLicenseMutation.mutate()}
                disabled={purchaseLicenseMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {purchaseLicenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Purchase'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Horse Dialog */}
        <Dialog open={showHorseDialog} onOpenChange={setShowHorseDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Horse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-400">Horse Name</Label>
                <Input
                  value={horseName}
                  onChange={(e) => setHorseName(e.target.value)}
                  placeholder="Enter name..."
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={30}
                />
              </div>
              <div>
                <Label className="text-slate-400">Avatar</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setHorseEmoji(emoji)}
                      className={`p-3 rounded-lg text-2xl transition-colors ${
                        horseEmoji === emoji ? 'bg-amber-500/20 border-2 border-amber-500' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => createHorseMutation.mutate()}
                disabled={createHorseMutation.isPending || !horseName.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {createHorseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Horse'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}