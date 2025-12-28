import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import GameShell from '@/components/games/GameShell';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LevelUpNotification from '@/components/LevelUpNotification';

// Game component imports
import AdvancedSlotMachine from '@/components/casino/AdvancedSlotMachine';
import BlackjackGame from '@/components/casino/BlackjackGame';
import PlinkoGame from '@/components/casino/PlinkoGame';

export default function PlayGame() {
  const [lastChange, setLastChange] = useState(0);
  const [levelUpData, setLevelUpData] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get game ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game');

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player, refetch: refetchPlayer } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      
      if (players.length > 0) return players[0];
      
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

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => base44.entities.Game.list('sort_order'),
  });

  const { data: houseConfig } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0] || null;
    },
  });

  const currentGame = games.find(g => g.game_id === gameId);

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
    },
  });

  const handleGameChange = (game) => {
    navigate(createPageUrl('PlayGame') + `?game=${game.game_id}`);
  };

  const handleSlotSpin = async (result) => {
    if (!player) return;
    
    setLastChange(result.net_result);
    
    // Calculate XP gain: 1 XP per 10 points wagered + bonus for wins
    const xpGain = Math.floor(result.total_bet / 10) + (result.net_result > 0 ? 20 : 0);
    
    // Award XP and check for level up
    try {
      const levelUpResult = await base44.functions.invoke('calculateLevelUp', {
        player_id: player.id,
        xp_to_add: xpGain
      });
      
      if (levelUpResult.data.levels_gained > 0) {
        setLastChange(result.net_result + levelUpResult.data.bonus_awarded);
      }
    } catch (err) {
      console.error('Level up error:', err);
    }
    
    await refetchPlayer();
    queryClient.invalidateQueries({ queryKey: ['slotSessions'] });
    queryClient.invalidateQueries({ queryKey: ['houseConfig'] });
    
    // Check referral bonus eligibility
    if (player.referred_by && !player.referral_bonus_claimed) {
      try {
        await base44.functions.invoke('checkReferralBonus', { player_id: player.id });
      } catch (err) {
        // Silent
      }
    }
  };

  const handleBlackjackEnd = async (result) => {
    if (!player) return;
    
    const pointsDelta = result.payout - result.bet;
    const newBalance = player.points_balance + pointsDelta;
    const xpGain = Math.floor(result.bet / 10) + (pointsDelta > 0 ? 20 : 0);
    
    setLastChange(pointsDelta);
    
    await updatePlayer.mutateAsync({
      updates: {
        points_balance: newBalance,
        total_wagered: player.total_wagered + result.bet,
        total_won: player.total_won + (pointsDelta > 0 ? result.payout : 0),
        games_played: player.games_played + 1,
        biggest_win: Math.max(player.biggest_win || 0, result.payout),
        blackjack_games_played: (player.blackjack_games_played || 0) + 1,
        blackjack_wins: (player.blackjack_wins || 0) + (pointsDelta > 0 ? 1 : 0),
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
        reason: pointsDelta > 0 ? 'game_win' : 'game_bet',
        balance_after: newBalance,
        note: `Blackjack: ${result.outcome}`,
      },
    });
    
    // Calculate XP and check for level up
    try {
      const levelUpResult = await base44.functions.invoke('calculateLevelUp', {
        player_id: player.id,
        xp_to_add: xpGain
      });
      
      if (levelUpResult.data.levels_gained > 0) {
        setLastChange(pointsDelta + levelUpResult.data.bonus_awarded);
      }
    } catch (err) {
      console.error('Level up error:', err);
    }
    
    await refetchPlayer();
  };

  const handlePlinkoComplete = async (result) => {
    if (!player) return;
    
    setLastChange(result.net_result);
    
    // Calculate XP gain: 1 XP per 10 points wagered + bonus for wins
    const xpGain = Math.floor(result.bet_amount / 10) + (result.net_result > 0 ? 15 : 0);
    
    // Award XP and check for level up
    try {
      const levelUpResult = await base44.functions.invoke('calculateLevelUp', {
        player_id: player.id,
        xp_to_add: xpGain
      });
      
      if (levelUpResult.data.levels_gained > 0) {
        setLastChange(result.net_result + levelUpResult.data.bonus_awarded);
      }
    } catch (err) {
      console.error('Level up error:', err);
    }
    
    await refetchPlayer();
    queryClient.invalidateQueries({ queryKey: ['plinkoSessions'] });
    
    // Check referral bonus eligibility
    if (player.referred_by && !player.referral_bonus_claimed) {
      try {
        await base44.functions.invoke('checkReferralBonus', { player_id: player.id });
      } catch (err) {
        // Silent
      }
    }
  };

  const renderGame = () => {
    if (!currentGame || !currentGame.enabled) {
      return (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Game not found or unavailable</p>
        </div>
      );
    }

    switch (currentGame.component) {
      case 'AdvancedSlotMachine':
        return (
          <AdvancedSlotMachine
            balance={player?.points_balance || 0}
            onSpinComplete={handleSlotSpin}
            houseConfig={houseConfig}
          />
        );
      
      case 'BlackjackGame':
        return (
          <BlackjackGame
            balance={player?.points_balance || 0}
            onGameEnd={handleBlackjackEnd}
            disabled={updatePlayer.isPending}
          />
        );
      
      case 'PlinkoGame':
        return (
          <PlinkoGame
            balance={player?.points_balance || 0}
            onDropComplete={handlePlinkoComplete}
            houseConfig={houseConfig}
          />
        );
      
      default:
        return (
          <div className="text-center py-20">
            <p className="text-slate-400">Game component not implemented</p>
          </div>
        );
    }
  };

  if (userLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!gameId || !currentGame) {
    navigate(createPageUrl('GameGallery'));
    return null;
  }

  return (
    <>
      <LevelUpNotification
        show={!!levelUpData}
        level={levelUpData?.level}
        bonus={levelUpData?.bonus}
        onClose={() => setLevelUpData(null)}
      />
      <GameShell
        currentGame={currentGame}
        allGames={games}
        onGameChange={handleGameChange}
        balance={player?.points_balance || 0}
        lastChange={lastChange}
        level={player?.level || 1}
        xp={player?.xp || 0}
        key={player?.id}
      >
        {renderGame()}
      </GameShell>
    </>
  );
}