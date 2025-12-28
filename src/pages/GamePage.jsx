import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GameShell from '@/components/game-shell/GameShell';
import AdvancedSlotMachine from '@/components/casino/AdvancedSlotMachine';
import BlackjackGame from '@/components/casino/BlackjackGame';
import PlinkoGame from '@/components/casino/PlinkoGame';
import LevelUpNotification from '@/components/LevelUpNotification';

import ScratchersGame from '@/components/games/ScratchersGame';

const GAME_COMPONENTS = {
  'slots': AdvancedSlotMachine,
  'blackjack': BlackjackGame,
  'plinko': PlinkoGame,
  'scratchers': ScratchersGame
};

export default function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameSlug = searchParams.get('slug');
  const queryClient = useQueryClient();
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player, refetch: refetchPlayer } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      if (players.length > 0) {
        // Track activity
        try {
          await base44.functions.invoke('trackActivity', { player_id: players[0].id });
        } catch (err) {
          console.error('Activity tracking failed:', err);
        }
        return players[0];
      }
      navigate('/');
      return null;
    },
    enabled: !!currentUser,
  });

  const { data: game } = useQuery({
    queryKey: ['game', gameSlug],
    queryFn: async () => {
      const games = await base44.entities.Game.filter({ game_id: gameSlug });
      return games[0] || null;
    },
    enabled: !!gameSlug,
  });

  const { data: houseConfig } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0];
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ playerId, updates }) => base44.entities.Player.update(playerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
    },
  });

  const handleGameResult = async (result) => {
    if (!player) return;

    const bet = result.bet || result.total_bet || 0;
    const payout = result.payout || result.total_win || 0;
    const net = payout - bet;

    // Create ledger entry with share slug for big wins
    let shareSlug = null;
    if (payout >= 250000) {
      shareSlug = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      try {
        await base44.functions.invoke('createAnnouncement', {
          player_id: player.id,
          type: payout >= 1000000 ? 'jackpot' : 'big_win',
          game_id: gameSlug,
          game_name: game?.name || gameSlug,
          amount: payout,
          multiplier: bet > 0 ? payout / bet : 0
        });
      } catch (err) {
        console.error('Announcement creation failed:', err);
      }
    }

    // Calculate XP
    const baseXP = Math.floor(bet / 10);
    const winBonus = payout > bet ? Math.floor((payout - bet) / 20) : 0;
    const totalXP = baseXP + winBonus;

    // Update player stats
    const newBalance = player.points_balance + net;
    const newXP = (player.xp || 0) + totalXP;
    const newWagered = (player.total_wagered || 0) + bet;
    const newWon = (player.total_won || 0) + payout;
    const newGamesPlayed = (player.games_played || 0) + 1;

    const updates = {
      points_balance: newBalance,
      xp: newXP,
      total_wagered: newWagered,
      total_won: newWon,
      games_played: newGamesPlayed,
      biggest_win: Math.max(player.biggest_win || 0, payout)
    };

    // Game-specific stats
    if (gameSlug === 'slots') {
      updates.slots_games_played = (player.slots_games_played || 0) + 1;
      updates.slots_total_bet = (player.slots_total_bet || 0) + bet;
    } else if (gameSlug === 'blackjack') {
      updates.blackjack_games_played = (player.blackjack_games_played || 0) + 1;
      if (result.outcome === 'win' || result.outcome === 'blackjack') {
        updates.blackjack_wins = (player.blackjack_wins || 0) + 1;
        updates.blackjack_current_streak = (player.blackjack_current_streak || 0) + 1;
        updates.blackjack_longest_streak = Math.max(
          player.blackjack_longest_streak || 0,
          updates.blackjack_current_streak
        );
      } else if (result.outcome !== 'push') {
        updates.blackjack_current_streak = 0;
      }
    } else if (gameSlug === 'plinko') {
      updates.plinko_drops = (player.plinko_drops || 0) + 1;
    } else if (gameSlug === 'scratchers') {
      // Scratchers stats are handled in playScratchCard backend
    }

    await updatePlayerMutation.mutateAsync({ playerId: player.id, updates });

    // Check for level up
    try {
      const levelUpResponse = await base44.functions.invoke('calculateLevelUp', {
        player_id: player.id,
        xp_to_add: totalXP
      });

      if (levelUpResponse.data.level_up) {
        setLevelUpData(levelUpResponse.data);
        setShowLevelUp(true);
        toast.success(`Level Up! You're now level ${levelUpResponse.data.new_level}!`);
      }
    } catch (err) {
      console.error('Level up calculation failed:', err);
    }

    // Check referral progression
    if (player.referred_by) {
      try {
        await base44.functions.invoke('checkReferralBonus', { player_id: player.id });
      } catch (err) {
        console.error('Referral check failed:', err);
      }
    }

    // Calculate VIP tier
    try {
      await base44.functions.invoke('calculateVIPTier', { player_id: player.id });
    } catch (err) {
      console.error('VIP tier calculation failed:', err);
    }

    await refetchPlayer();
  };

  if (!currentUser || !player || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[game.component] || GAME_COMPONENTS[gameSlug];

  if (!GameComponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Game Not Found</h1>
          <p className="text-slate-400">This game is not available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameShell game={game} balance={player.points_balance}>
        <GameComponent
          balance={player.points_balance}
          onSpinComplete={gameSlug === 'slots' ? handleGameResult : undefined}
          onGameEnd={gameSlug === 'blackjack' || gameSlug === 'scratchers' ? handleGameResult : undefined}
          onDropComplete={gameSlug === 'plinko' ? handleGameResult : undefined}
          onGameEnd={gameSlug === 'scratchers' ? handleGameResult : undefined}
          houseConfig={houseConfig}
        />
      </GameShell>

      {showLevelUp && levelUpData && (
        <LevelUpNotification
          level={levelUpData.new_level}
          bonus={levelUpData.bonus_awarded}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </>
  );
}