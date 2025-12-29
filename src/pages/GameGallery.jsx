import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import GameCard from '@/components/games/GameCard';

export default function GameGallery() {
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
      
      if (players.length > 0) return players[0];
      
      // Check for referral code
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

      // Report user registration to Dev Center Ops
      try {
        await base44.functions.invoke('reportUserEvent', {
          app_name: 'The Backrooms',
          app_id: Deno.env?.get?.('BASE44_APP_ID') || 'the-backrooms',
          event_type: 'user_registered',
          user_email: currentUser.email,
          metadata: {
            player_id: newPlayer.id,
            game_start_date: newPlayer.created_date,
            signup_bonus: signupBonus,
            referred: !!referrerId
          }
        });
      } catch (err) {
        console.error('Failed to report user registration:', err);
      }
      
      if (referrerId) {
        const configs = await base44.entities.HouseConfig.list();
        const config = configs[0];
        
        // Give immediate bonus to inviter
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
    if (game.game_id === 'derby') {
      navigate(createPageUrl('DerbyLobby'));
    } else {
      navigate(createPageUrl('GamePage') + `?slug=${game.game_id}`);
    }
  };

  const featuredGames = games.filter(g => g.featured && g.enabled);
  const availableGames = games.filter(g => !g.coming_soon && g.enabled);
  const comingSoon = games.filter(g => g.coming_soon);

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
          <h1 className="text-4xl font-black text-white mb-4">🎮 Game Gallery</h1>
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-3">
            🎮 Game Gallery
          </h1>
          <p className="text-slate-400">Choose your game and start playing</p>
        </motion.div>

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Your Balance</p>
            <p className="text-4xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              {player?.points_balance?.toLocaleString() || 0}
            </p>
            <p className="text-slate-400 text-xs mt-1">points</p>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
              <p className="text-slate-400 text-xs">VIP Points: {player?.vip_points?.toLocaleString() || 0}</p>
              {player?.vip_tier > 0 && (
                <p className="text-purple-400 text-xs">VIP Tier {player.vip_tier}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Featured Games
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGames.map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Games */}
        {availableGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-black text-white mb-4">All Games</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableGames.map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Vault Games Section */}
        <motion.div
          id="vault-games"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-black text-white mb-2">🎰 Vault Games</h2>
          <p className="text-slate-400 text-sm mb-4">
            Ticketed experiences that live in your vault. Pay with your spendable balance, store the tickets in your vault/wallet, and redeem winnings automatically.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate(createPageUrl('FiftyFiftyPool'))}
              className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 text-left hover:scale-105 transition-transform"
            >
              <span className="text-4xl mb-3 block">🎯</span>
              <h3 className="text-white font-bold mb-1">50/50 Pool</h3>
              <p className="text-slate-400 text-sm">Win 50% of the total pot with vault-stored tickets</p>
            </button>

            <button
              onClick={() => navigate(createPageUrl('NumbersLottery'))}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-xl p-6 text-left hover:scale-105 transition-transform"
            >
              <span className="text-4xl mb-3 block">🎱</span>
              <h3 className="text-white font-bold mb-1">Numbers Lottery</h3>
              <p className="text-slate-400 text-sm">Pick numbers, store tickets safely, claim from your vault</p>
            </button>
          </div>
        </motion.div>

        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-black text-white mb-4">Coming Soon</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {comingSoon.map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </motion.div>
        )}

        {games.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">No games available yet</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
