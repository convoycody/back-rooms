import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Gift, Copy, CheckCircle2, TrendingUp, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { toast } from 'sonner';

export default function Referrals() {
  const [copied, setCopied] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player, refetch: refetchPlayer } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      const p = players[0] || null;
      
      // Auto-fix missing referral code
      if (p && !p.referral_code) {
        try {
          await base44.functions.invoke('fixReferralCode');
          const updatedPlayers = await base44.entities.Player.filter({ created_by: currentUser.email });
          return updatedPlayers[0] || null;
        } catch (err) {
          console.error('Failed to fix referral code:', err);
        }
      }
      
      return p;
    },
    enabled: !!currentUser,
  });

  const { data: houseConfig } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0] || null;
    },
  });

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['myReferrals', player?.id],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: player.id }, '-created_date'),
    enabled: !!player,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayersForReferrals'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!player && myReferrals.length > 0,
  });

  const referralUrl = player?.referral_code 
    ? `${window.location.origin}/#${createPageUrl('GameGallery')}?ref=${player.referral_code}`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = myReferrals
    .filter(r => r.referrer_bonus_claimed)
    .reduce((sum, r) => sum + (r.referrer_bonus || 0), 0);

  const pendingReferrals = myReferrals.filter(r => r.status === 'pending').length;
  const completedReferrals = myReferrals.filter(r => r.status === 'completed').length;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">🎁 Referral Program</h1>
          <p className="text-slate-400 mb-8">Please log in to view your referrals</p>
          <button 
            onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!houseConfig?.referral_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-slate-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Gift className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Referral System Disabled</h2>
            <p className="text-slate-400">The referral program is currently not active.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Gift className="w-8 h-8 text-amber-500" />
              Referral Program
            </h1>
            <p className="text-slate-400 mt-1">Invite friends and earn rewards together</p>
          </div>
          <Link to={createPageUrl('GameGallery')}>
            <Button variant="outline" className="border-slate-600 text-slate-300">
              Back to Games
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-white">{myReferrals.length}</p>
              <p className="text-slate-400 text-xs mt-1">
                {completedReferrals} completed • {pendingReferrals} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-400">{totalEarned.toLocaleString()}</p>
              <p className="text-slate-400 text-xs mt-1">Points from referrals</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border-amber-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Bonus Per Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-amber-400">
                {houseConfig.referral_inviter_bonus?.toLocaleString() || 0}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                After {houseConfig.referral_min_spins} games played
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Share Section */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-400" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">Share this link with friends:</p>
              <div className="flex gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-300 font-bold mb-2">How it works:</h3>
              <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                <li>Share your referral link with friends</li>
                <li>They get <span className="text-green-400 font-bold">{houseConfig.referral_new_user_bonus} bonus points</span> on signup</li>
                <li>After they play <span className="text-amber-400 font-bold">{houseConfig.referral_min_spins} games</span>, you earn <span className="text-purple-400 font-bold">{houseConfig.referral_inviter_bonus} points</span></li>
                <li>Everyone wins! 🎉</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Referral List */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {myReferrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No referrals yet</p>
                <p className="text-slate-500 text-sm">Share your link to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReferrals.map((referral) => {
                  const referee = allPlayers.find(p => p.id === referral.referee_id);
                  return (
                    <div 
                      key={referral.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                          {referee?.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{referee?.display_name || 'Unknown'}</p>
                          <p className="text-slate-500 text-xs">
                            Joined {moment(referral.created_date).fromNow()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {referral.status === 'completed' ? (
                          <div className="text-right">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Completed
                            </Badge>
                            <p className="text-green-400 text-sm font-bold mt-1">
                              +{referral.referrer_bonus || 0} pts
                            </p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Pending
                            </Badge>
                            <p className="text-slate-500 text-xs mt-1">
                              {referee?.games_played || 0}/{houseConfig.referral_min_spins} games
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}