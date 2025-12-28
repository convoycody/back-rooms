import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  User, 
  TrendingUp, 
  Trophy, 
  Coins, 
  Users, 
  Edit2, 
  Check, 
  X,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function UserProfile() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', player?.id],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: player.id }),
    enabled: !!player,
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (updates) => {
      await base44.entities.Player.update(player.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast.success('Profile updated successfully');
      setIsEditingName(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSaveName = () => {
    if (newDisplayName.trim()) {
      updatePlayerMutation.mutate({ display_name: newDisplayName.trim() });
    }
  };

  const handleSaveAvatar = () => {
    if (avatarUrl.trim()) {
      updatePlayerMutation.mutate({ avatar_url: avatarUrl.trim() });
      setAvatarUrl('');
    }
  };

  if (userLoading || playerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!currentUser || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  const xpForNextLevel = (player.level) * 500;
  const xpProgress = (player.xp % 500) / 5;
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const totalReferralEarnings = referrals.reduce((sum, r) => sum + (r.referrer_bonus || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('GameGallery')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-slate-400 mt-2">Manage your account and view your stats</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl overflow-hidden">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{player.display_name?.[0]?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black rounded-full w-10 h-10 flex items-center justify-center font-black text-sm">
                    {player.level}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  {/* Display Name */}
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Enter new name"
                        className="bg-slate-800 border-slate-700 text-white max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        onClick={handleSaveName}
                        disabled={updatePlayerMutation.isPending}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setIsEditingName(false)}
                        className="border-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <h2 className="text-3xl font-black text-white">{player.display_name}</h2>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setNewDisplayName(player.display_name || '');
                          setIsEditingName(true);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-slate-400 text-sm mb-4">{currentUser.email}</p>

                  {/* Level Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Level {player.level}</span>
                      <span className="text-slate-400">{player.xp} / {xpForNextLevel} XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Avatar URL Input */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <Label className="text-slate-400 text-sm mb-2 block">Change Avatar (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button
                    onClick={handleSaveAvatar}
                    disabled={!avatarUrl.trim() || updatePlayerMutation.isPending}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    {updatePlayerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-amber-900/50 to-yellow-900/50 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-amber-400">
                  {player.points_balance.toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">points</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Wagered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Total Wagered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-blue-400">
                  {(player.total_wagered || 0).toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">lifetime</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Won */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-400" />
                  Total Won
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-green-400">
                  {(player.total_won || 0).toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">lifetime</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Biggest Win */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  Biggest Win
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-purple-400">
                  {(player.biggest_win || 0).toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">points</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Games Played */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🎮 Games Played
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-white">
                  {player.games_played || 0}
                </p>
                <p className="text-slate-400 text-sm mt-1">total sessions</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Referrals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-pink-900/50 to-rose-900/50 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-pink-400">
                  {completedReferrals}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {pendingReferrals > 0 && `+${pendingReferrals} pending`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Referral Earnings */}
        {totalReferralEarnings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Referral Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Earned from Referrals</p>
                    <p className="text-3xl font-black text-green-400">
                      {totalReferralEarnings.toLocaleString()} points
                    </p>
                  </div>
                  <Link to={createPageUrl('Referrals')}>
                    <Button className="bg-purple-500 hover:bg-purple-600">
                      View Referrals
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Game-Specific Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Game Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Slots */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">🎰 Slots</p>
                  <p className="text-2xl font-bold text-purple-400">{player.slots_games_played || 0}</p>
                  <p className="text-slate-500 text-xs">games played</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Total bet: {(player.slots_total_bet || 0).toLocaleString()}
                  </p>
                </div>

                {/* Blackjack */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">🃏 Blackjack</p>
                  <p className="text-2xl font-bold text-green-400">{player.blackjack_games_played || 0}</p>
                  <p className="text-slate-500 text-xs">games played</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Wins: {player.blackjack_wins || 0} • Streak: {player.blackjack_longest_streak || 0}
                  </p>
                </div>

                {/* Plinko */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">🎯 Plinko</p>
                  <p className="text-2xl font-bold text-orange-400">{player.plinko_drops || 0}</p>
                  <p className="text-slate-500 text-xs">balls dropped</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}