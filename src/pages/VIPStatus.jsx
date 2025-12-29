import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, Star, Sparkles, Trophy, Gem, TrendingUp, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import VIPBadge from '@/components/VIPBadge';

const VIP_TIERS = [
  {
    tier: 0,
    name: 'Player',
    threshold: 0,
    color: 'slate',
    icon: null,
    dailyBonus: '10,000',
    perks: [
      'Daily bonus: 10,000 pts',
      'Standard top-up limits',
      'Access to all core games',
      'Eligible for Noon Drop'
    ]
  },
  {
    tier: 1,
    name: 'Regular',
    threshold: 5000,
    color: 'blue',
    icon: Star,
    dailyBonus: '11,000',
    perks: [
      '+10% daily bonus (11,000 pts)',
      '+1 extra auto top-up per day',
      'Game history & stats',
      'Regular badge'
    ]
  },
  {
    tier: 2,
    name: 'Insider',
    threshold: 15000,
    color: 'purple',
    icon: Sparkles,
    dailyBonus: '12,000',
    perks: [
      '+20% daily bonus (12,000 pts)',
      'Reduced top-up cooldown',
      'Early access to new games (24h)',
      'Insider badge & UI accent'
    ]
  },
  {
    tier: 3,
    name: 'High Roller',
    threshold: 40000,
    color: 'amber',
    icon: Trophy,
    dailyBonus: '13,500',
    perks: [
      '+35% daily bonus (13,500 pts)',
      'Higher daily top-up cap',
      'Increased max bet ceiling',
      'Priority in events',
      'Custom avatar frame',
      'Name highlight in leaderboards'
    ]
  },
  {
    tier: 4,
    name: 'Elite',
    threshold: 100000,
    color: 'emerald',
    icon: Crown,
    dailyBonus: '15,000',
    perks: [
      '+50% daily bonus (15,000 pts)',
      'Exclusive Elite UI theme',
      'Monthly Elite grant',
      'Access to Elite Events',
      'Faster loading & UX',
      'Elite badge'
    ]
  },
  {
    tier: 5,
    name: 'Legend',
    threshold: 250000,
    color: 'pink',
    icon: Gem,
    dailyBonus: '17,500',
    perks: [
      '+75% daily bonus (17,500 pts)',
      'One Legend Chest per month',
      'Early access to experimental features',
      'Permanent Legend badge',
      'Custom profile flair',
      'Legend-only leaderboard archive'
    ]
  }
];

const COLOR_GRADIENTS = {
  slate: 'from-slate-900/50 to-slate-950/50 border-slate-700/30',
  blue: 'from-blue-900/50 to-blue-950/50 border-blue-700/30',
  purple: 'from-purple-900/50 to-purple-950/50 border-purple-700/30',
  amber: 'from-amber-900/50 to-amber-950/50 border-amber-700/30',
  emerald: 'from-emerald-900/50 to-emerald-950/50 border-emerald-700/30',
  pink: 'from-pink-900/50 to-pink-950/50 border-pink-700/30'
};

export default function VIPStatus() {
  const { data: currentUser, isLoading: userLoading } = useQuery({
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

  if (userLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const currentTier = player.vip_tier || 0;
  const currentVIPPoints = player.vip_points || 0;
  const currentTierInfo = VIP_TIERS[currentTier];
  const nextTierInfo = VIP_TIERS[currentTier + 1];

  // Calculate progress to next tier
  const nextTierRequirement = nextTierInfo?.threshold || null;
  const currentTierRequirement = VIP_TIERS[currentTier]?.threshold || 0;
  const progressPercent = nextTierRequirement 
    ? ((currentVIPPoints - currentTierRequirement) / (nextTierRequirement - currentTierRequirement)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('GameGallery')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                VIP Status
              </h1>
              <p className="text-slate-400 mt-2">Earned through play and participation</p>
            </div>
            {currentTier > 0 && <VIPBadge tier={currentTier} size="lg" showName={true} />}
          </div>
        </div>

        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`bg-gradient-to-br ${COLOR_GRADIENTS[currentTierInfo.color]} overflow-hidden relative`}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
            <CardContent className="p-8 relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Current Tier</p>
                  <h2 className="text-4xl font-black text-white mb-2">{currentTierInfo.name}</h2>
                  <p className="text-slate-300">
                    {currentVIPPoints.toLocaleString()} VIP Points
                  </p>
                </div>
                {currentTierInfo.icon && (
                  <currentTierInfo.icon className={`w-16 h-16 text-${currentTierInfo.color}-400 opacity-50`} />
                )}
              </div>

              {nextTierInfo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Progress to {nextTierInfo.name}</span>
                    <span className="text-white font-semibold">
                      {currentVIPPoints.toLocaleString()} / {nextTierRequirement?.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={Math.min(progressPercent, 100)} className="h-3" />
                  <p className="text-slate-400 text-xs">
                    {nextTierRequirement - currentVIPPoints > 0 
                      ? `${(nextTierRequirement - currentVIPPoints).toLocaleString()} VIP points to next tier`
                      : 'Eligible for tier upgrade!'}
                  </p>
                </div>
              )}

              {currentTier === 5 && (
                <div className="text-center py-4">
                  <Gem className="w-12 h-12 mx-auto text-pink-400 mb-2" />
                  <p className="text-white font-bold text-lg">Maximum Tier Reached</p>
                  <p className="text-slate-400 text-sm">You've achieved Legend status!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Earn VIP Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-900/50 border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                How to Earn VIP Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Wager Points</p>
                  <p className="text-white font-bold">10% of bet</p>
                  <p className="text-slate-500 text-xs mt-1">Bet 1000 pts = 100 VIP pts</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Win Bonus</p>
                  <p className="text-white font-bold">5% of net win</p>
                  <p className="text-slate-500 text-xs mt-1">Win 2000 net = 100 VIP pts</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Your Progress</p>
                  <p className="text-purple-400 font-bold text-xl">{player.vip_points?.toLocaleString() || 0}</p>
                  <p className="text-slate-400 text-xs mt-1">VIP Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* All Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">All VIP Tiers</h2>
          <div className="space-y-4">
            {VIP_TIERS.map((tierInfo) => {
              const Icon = tierInfo.icon;
              const isUnlocked = currentTier >= tierInfo.tier;
              const isCurrent = currentTier === tierInfo.tier;

              return (
                <Card 
                  key={tierInfo.tier} 
                  className={`bg-gradient-to-br ${COLOR_GRADIENTS[tierInfo.color]} ${isCurrent ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isUnlocked ? `bg-${tierInfo.color}-500/20` : 'bg-slate-800'
                      }`}>
                        {Icon ? (
                          <Icon className={`w-6 h-6 ${isUnlocked ? `text-${tierInfo.color}-400` : 'text-slate-600'}`} />
                        ) : (
                          <span className="text-2xl">{isUnlocked ? '✓' : <Lock className="w-5 h-5 text-slate-600" />}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{tierInfo.name}</h3>
                          {isCurrent && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              Current Tier
                            </Badge>
                          )}
                          {isUnlocked && !isCurrent && (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                        {tierInfo.threshold > 0 && (
                          <p className={`text-sm mb-3 ${isUnlocked ? 'text-green-400' : 'text-slate-400'}`}>
                            {isUnlocked ? '✓ ' : '🔒 '}Requires: {tierInfo.threshold.toLocaleString()} VIP points
                          </p>
                        )}
                        <div className="grid md:grid-cols-2 gap-2">
                          {tierInfo.perks.map((perk, i) => (
                            <div key={i} className={`text-sm ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
                              • {perk}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Important Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <h3 className="text-blue-400 font-bold mb-2">Important: VIP Status is Fair</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• VIP status does NOT affect game outcomes or RNG</li>
                <li>• VIP perks provide convenience and bonuses, not gameplay advantages</li>
                <li>• All players have equal chances in all games</li>
                <li>• VIP is earned through participation, not spending</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
