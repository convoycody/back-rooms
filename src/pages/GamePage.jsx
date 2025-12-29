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
  'AdvancedSlotMachine': AdvancedSlotMachine,
  'blackjack': BlackjackGame,
  'BlackjackGame': BlackjackGame,
  'plinko': PlinkoGame,
  'PlinkoGame': PlinkoGame,
  'scratchers': ScratchersGame,
  'ScratchersGame': ScratchersGame,
  'derby': () => null // Derby handled by dedicated pages
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

    // Update player stats
    const newBalance = player.points_balance + net;
    const newWagered = (player.total_wagered || 0) + bet;
    const newWon = (player.total_won || 0) + payout;

    const updates = {
      points_balance: newBalance,
      total_wagered: newWagered,
      total_won: newWon,
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
    }

    await updatePlayerMutation.mutateAsync({ playerId: player.id, updates });

    // Process progression through unified engine
    try {
      const progressionResponse = await base44.functions.invoke('processPlayerProgression', {
        player_id: player.id,
        event_type: 'game_completed',
        event_data: { bet, payout }
      });

      const { rewards } = progressionResponse.data;

      if (rewards.tier_up) {
        setLevelUpData({
          new_tier: rewards.new_tier,
          bonus_awarded: rewards.points_awarded,
          tier_name: rewards.tier_name
        });
        setShowLevelUp(true);
        toast.success(`VIP Tier Up! You're now ${rewards.tier_name}!`);
      } else if (rewards.level_up) {
        toast.success(`Level Up! You're now level ${rewards.new_level}!`);
      }
    } catch (err) {
      console.error('Progression processing failed:', err);
    }

    // Check referral progression
    if (player.referred_by) {
      try {
        await base44.functions.invoke('checkReferralBonus', { player_id: player.id });
      } catch (err) {
        console.error('Referral check failed:', err);
      }
    }

    await refetchPlayer();
  };

  const [errorId, setErrorId] = useState(null);

  useEffect(() => {
    if (game && !GAME_COMPONENTS[game.component] && !GAME_COMPONENTS[gameSlug]) {
      // Log game load failure
      base44.functions.invoke('logError', {
        error_type: 'game_load_failed',
        error_message: `Game component not found: ${game.component || gameSlug}`,
        page_url: window.location.href,
        game_slug: gameSlug,
        additional_data: {
          game_id: game.id,
          game_name: game.name,
          component: game.component,
          available_components: Object.keys(GAME_COMPONENTS)
        }
      }).then(response => {
        if (response.data?.error_id) {
          setErrorId(response.data.error_id);
        }
      }).catch(err => {
        console.error('Failed to log game error:', err);
      });
    }
  }, [game, gameSlug]);

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
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Game Loading Error</h1>
          <p className="text-slate-400 mb-4">This game component failed to load.</p>
          {errorId && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
              <p className="text-slate-400 text-sm mb-1">Error ID:</p>
              <p className="text-amber-400 font-mono text-lg font-bold">{errorId}</p>
              <p className="text-slate-500 text-xs mt-2">Please share this ID with support if the issue persists.</p>
            </div>
          )}
          <button
            onClick={() => navigate(createPageUrl('GameGallery'))}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameShell game={game} balance={player.points_balance}>
        <GameComponent
          balance={player.points_balance}
          onSpinComplete={gameSlug?.startsWith('slots') ? handleGameResult : undefined}
          onGameEnd={gameSlug?.startsWith('blackjack') || gameSlug?.startsWith('scratchers') ? handleGameResult : undefined}
          onDropComplete={gameSlug?.startsWith('plinko') ? handleGameResult : undefined}
          houseConfig={houseConfig}
        />
      </GameShell>

      {showLevelUp && levelUpData && (
        <LevelUpNotification
          tier={levelUpData.new_tier}
          bonus={levelUpData.bonus_awarded}
          tier_name={levelUpData.tier_name}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </>
  );
}