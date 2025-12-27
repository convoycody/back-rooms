import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

import AdvancedSlotMachine from '@/components/casino/AdvancedSlotMachine';
import BlackjackGame from '@/components/casino/BlackjackGame';
import BalanceDisplay from '@/components/casino/BalanceDisplay';
import EnhancedLeaderboard from '@/components/casino/EnhancedLeaderboard';
import RecentGames from '@/components/casino/RecentGames';
import DailyBonusCard from '@/components/casino/DailyBonusCard';
import TopUpCard from '@/components/casino/TopUpCard';

export default function Casino() {
  const [lastChange, setLastChange] = useState(0);
  const [activeGame, setActiveGame] = useState('slots');
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Get or create player profile
  const { data: player, isLoading: playerLoading, refetch: refetchPlayer } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      
      if (players.length > 0) {
        return players[0];
      }
      
      // Check for referral code in URL
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
      
      // Generate unique referral code
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create new player
      const newPlayer = await base44.entities.Player.create({
        display_name: currentUser.full_name || currentUser.email.split('@')[0],
        referral_code: referralCode,
        points_balance: signupBonus,
        level: 1,
        xp: 0,
        total_wagered: 0,
        total_won: 0,
        games_played: 0,
        biggest_win: 0,
        referred_by: referrerId,
      });
      
      // Log signup bonus
      await base44.entities.Ledger.create({
        player_id: newPlayer.id,
        change: signupBonus,
        reason: 'signup_bonus',
        balance_after: signupBonus,
        note: referrerId ? 'Welcome bonus + referral bonus!' : 'Welcome bonus!'
      });
      
      // Create referral record if referred
      if (referrerId) {
        const configs = await base44.entities.HouseConfig.list();
        const config = configs[0];
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

  // Get all players for leaderboard
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list('-total_won', 20),
  });

  // Get house config
  const { data: houseConfig } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0] || null;
    },
  });

  // Get player's game sessions (both types)
  const { data: gameSessions = [] } = useQuery({
    queryKey: ['gameSessions', player?.id],
    queryFn: () => base44.entities.GameSession.filter(
      { player_id: player.id },
      '-created_date',
      25
    ),
    enabled: !!player,
  });

  const { data: slotSessions = [] } = useQuery({
    queryKey: ['slotSessions', player?.id],
    queryFn: () => base44.entities.SlotSession.filter(
      { player_id: player.id },
      '-created_date',
      25
    ),
    enabled: !!player,
  });

  const sessions = [...gameSessions, ...slotSessions].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  ).slice(0, 50);

  // Update player mutation
  const updatePlayer = useMutation({
    mutationFn: async ({ updates, session, ledgerEntry }) => {
      await base44.entities.Player.update(player.id, updates);
      
      if (session) {
        await base44.entities.GameSession.create(session);
      }
      
      if (ledgerEntry) {
        await base44.entities.Ledger.create(ledgerEntry);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
    },
  });

  const handleSlotSpin = async (result) => {
    if (!player) return;
    
    setLastChange(result.net_result);
    
    // Just refetch - the backend function already updated everything
    await refetchPlayer();
    queryClient.invalidateQueries({ queryKey: ['slotSessions'] });
    queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
    queryClient.invalidateQueries({ queryKey: ['houseConfig'] });
    
    // Check referral bonus eligibility
    if (player.referred_by && !player.referral_bonus_claimed) {
      try {
        await base44.functions.invoke('checkReferralBonus', { player_id: player.id });
      } catch (err) {
        // Silent fail - bonus will be checked on next game
      }
    }
  };

  const handleBlackjackEnd = async (result) => {
    if (!player) return;
    
    const pointsDelta = result.payout - result.bet;
    const newBalance = player.points_balance + pointsDelta;
    const xpGain = Math.floor(result.bet / 10) + (pointsDelta > 0 ? 15 : 0);
    const newXp = player.xp + xpGain;
    const newLevel = Math.floor(newXp / 500) + 1;
    
    const isWin = pointsDelta > 0;
    const currentStreak = isWin ? (player.blackjack_current_streak || 0) + 1 : 0;
    const longestStreak = Math.max(player.blackjack_longest_streak || 0, currentStreak);
    
    setLastChange(pointsDelta);
    
    await updatePlayer.mutateAsync({
      updates: {
        points_balance: newBalance,
        xp: newXp,
        level: newLevel,
        total_wagered: player.total_wagered + result.bet,
        total_won: player.total_won + (pointsDelta > 0 ? result.payout : 0),
        games_played: player.games_played + 1,
        biggest_win: Math.max(player.biggest_win || 0, result.payout),
        blackjack_games_played: (player.blackjack_games_played || 0) + 1,
        blackjack_wins: (player.blackjack_wins || 0) + (isWin ? 1 : 0),
        blackjack_current_streak: currentStreak,
        blackjack_longest_streak: longestStreak,
      },
      session: {
        player_id: player.id,
        game_type: 'blackjack',
        bet_amount: result.bet,
        result: result.outcome === 'blackjack' ? 'jackpot' : 
                result.payout > result.bet ? 'win' : 
                result.payout === result.bet ? 'push' : 'loss',
        points_delta: pointsDelta,
        multiplier: result.payout / result.bet,
        game_data: {
          player_hand: result.playerHand,
          dealer_hand: result.dealerHand,
          player_value: result.playerValue,
          dealer_value: result.dealerValue,
        },
        rng_seed: Math.random().toString(36).substring(7),
      },
      ledgerEntry: {
        player_id: player.id,
        change: pointsDelta,
        reason: pointsDelta > 0 ? 'game_win' : pointsDelta === 0 ? 'game_bet' : 'game_bet',
        balance_after: newBalance,
        note: `Blackjack: ${result.outcome}`,
      },
    });
    
    await refetchPlayer();
    
    // Check referral bonus eligibility
    if (player.referred_by && !player.referral_bonus_claimed) {
      try {
        await base44.functions.invoke('checkReferralBonus', { player_id: player.id });
      } catch (err) {
        // Silent fail - bonus will be checked on next game
      }
    }
  };

  if (userLoading || playerLoading) {
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
          <h1 className="text-4xl font-black text-white mb-4">🎰 Office Casino</h1>
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
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Games Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeGame} onValueChange={setActiveGame} className="w-full">
              <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 mb-6">
                <TabsTrigger 
                  value="slots" 
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg py-3 font-bold"
                >
                  🎰 5×3 Slots
                </TabsTrigger>
                <TabsTrigger 
                  value="blackjack"
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-black rounded-lg py-3 font-bold"
                >
                  🃏 Blackjack
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="slots" className="mt-0">
                  <motion.div
                    key="slots"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <AdvancedSlotMachine 
                      balance={player?.points_balance || 0}
                      onSpinComplete={handleSlotSpin}
                      houseConfig={houseConfig}
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent value="blackjack" className="mt-0">
                  <motion.div
                    key="blackjack"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <BlackjackGame
                      balance={player?.points_balance || 0}
                      onGameEnd={handleBlackjackEnd}
                      disabled={updatePlayer.isPending}
                    />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DailyBonusCard 
              playerId={player?.id}
              balance={player?.points_balance || 0}
              onClaimed={(amount) => {
                setLastChange(amount);
                refetchPlayer();
              }}
            />

            <TopUpCard
              playerId={player?.id}
              balance={player?.points_balance || 0}
              onTopUp={(amount) => {
                setLastChange(amount);
                refetchPlayer();
              }}
            />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <EnhancedLeaderboard currentPlayerId={player?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <RecentGames sessions={sessions} />
            </motion.div>
          </div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 pb-8"
        >
          <p className="text-slate-600 text-xs max-w-xl mx-auto">
            This platform uses fictional points for entertainment only. 
            No real money, prizes, or items of value are involved. 
            Play responsibly! 🎲
          </p>
        </motion.div>
      </div>
    </div>
  );
}