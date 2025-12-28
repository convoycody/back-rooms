import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Trophy, MessageSquare, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameCard from '@/components/games/GameCard';
import DailyBonusCard from '@/components/casino/DailyBonusCard';
import NoonDropCard from '@/components/NoonDropCard';
import EnhancedLeaderboard from '@/components/casino/EnhancedLeaderboard';
import AnnouncementsStrip from '@/components/home/AnnouncementsStrip';
import LargeWinningsPreview from '@/components/home/LargeWinningsPreview';

export default function Home() {
  const navigate = useNavigate();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      
      if (players.length > 0) {
        // Track activity on home page load
        try {
          await base44.functions.invoke('trackActivity', { player_id: players[0].id });
        } catch (err) {
          console.error('Activity tracking failed:', err);
        }
        return players[0];
      }
      
      // New player signup logic
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      
      let referrerId = null;
      let signupBonus = 1000;
      
      if (refCode) {
        const referrers = await base44.entities.Player.filter({ referral_code: refCode });
        if (referrers.length > 0) {
          referrerId = referrers[0].id;
          const configs = await base44.entities.HouseConfig.list();
          const config = configs[0];
          if (config?.referral_enabled) {
            signupBonus += config.referral_new_user_bonus || 0;
          }
        }
      }
      
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newPlayer = await base44.entities.Player.create({
        display_name: currentUser.full_name || currentUser.email.split('@')[0],
        referral_code: referralCode,
        points_balance: signupBonus,
        level: 1,
        xp: 0,
      });

      await base44.entities.Ledger.create({
        player_id: newPlayer.id,
        change: signupBonus,
        reason: 'signup_bonus',
        balance_after: signupBonus,
        note: referrerId ? 'Welcome + referral bonus!' : 'Welcome bonus!'
      });
      
      if (referrerId) {
        const configs = await base44.entities.HouseConfig.list();
        const config = configs[0];
        
        const immediateBonus = config?.referral_immediate_inviter_bonus || 10000;
        const referrers = await base44.entities.Player.filter({ id: referrerId });
        if (referrers.length > 0) {
          const referrerPlayer = referrers[0];
          const newReferrerBalance = referrerPlayer.points_balance + immediateBonus;
          
          await base44.entities.Player.update(referrerId, {
            points_balance: newReferrerBalance
          });
          
          await base44.entities.Ledger.create({
            player_id: referrerId,
            change: immediateBonus,
            reason: 'referral_bonus',
            balance_after: newReferrerBalance,
            note: `Immediate referral bonus from ${newPlayer.display_name}`
          });
        }
        
        await base44.entities.Referral.create({
          referrer_id: referrerId,
          referee_id: newPlayer.id,
          referral_code_used: refCode,
          referee_signup_bonus: config?.referral_new_user_bonus || 0,
          status: 'pending'
        });
      }
      
      return newPlayer;
    },
    enabled: !!currentUser,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => base44.entities.Game.list('sort_order'),
  });

  const handlePlayGame = (game) => {
    navigate(`/games/${game.game_id}`);
  };

  const featuredGames = games.filter(g => g.featured && g.enabled);

  if (userLoading || gamesLoading) {
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
          <h1 className="text-4xl font-black text-white mb-4">🎮 The Backrooms</h1>
          <p className="text-slate-400 mb-8">Please log in to play</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Strip */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 rounded-2xl p-6 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Your Balance</p>
              <p className="text-4xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                {player?.points_balance?.toLocaleString() || 0}
              </p>
              <p className="text-slate-400 text-xs mt-1">points</p>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-slate-400 text-xs">Level {player?.level || 1}</p>
                <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${((player?.xp || 0) % 500) / 500 * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Bonus */}
            <DailyBonusCard playerId={player?.id} balance={player?.points_balance} />

            {/* Noon Drop */}
            <NoonDropCard />
          </div>
        </motion.div>

        {/* Announcements Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AnnouncementsStrip />
        </motion.div>

        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-400" />
                Featured Games
              </h2>
              <Button 
                variant="outline" 
                onClick={() => navigate(createPageUrl('GameGallery'))}
                className="border-slate-600 text-slate-300"
              >
                View All
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGames.slice(0, 3).map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Large Winnings + Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 grid md:grid-cols-2 gap-6"
        >
          <LargeWinningsPreview />
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Top Players
              </h2>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('Leaderboards'))}
                className="text-slate-400 hover:text-white"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <EnhancedLeaderboard />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(createPageUrl('Referrals'))}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-xl p-6 text-left hover:scale-105 transition-transform"
            >
              <Gift className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-white font-bold mb-1">Invite Friends</h3>
              <p className="text-slate-400 text-sm">Earn rewards together</p>
            </button>

            <button
              onClick={() => navigate(createPageUrl('VIPStatus'))}
              className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-700/50 rounded-xl p-6 text-left hover:scale-105 transition-transform"
            >
              <span className="text-4xl mb-3 block">👑</span>
              <h3 className="text-white font-bold mb-1">VIP Status</h3>
              <p className="text-slate-400 text-sm">Level {player?.vip_tier || 0} • View perks</p>
            </button>

            <button
              onClick={() => navigate(createPageUrl('Store'))}
              className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 text-left hover:scale-105 transition-transform"
            >
              <span className="text-4xl mb-3 block">💰</span>
              <h3 className="text-white font-bold mb-1">Get Points</h3>
              <p className="text-slate-400 text-sm">Purchase points packs</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}