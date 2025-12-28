import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Settings, Gamepad2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function GameSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => base44.entities.Game.list('sort_order'),
  });

  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, updates }) => {
      await base44.entities.Game.update(gameId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success('Game settings updated');
    },
  });

  if (gamesLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Admin')}>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-purple-500" />
                Game Settings
              </h1>
              <p className="text-slate-400">Configure limits and settings for each game</p>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <span className="text-3xl">{game.icon}</span>
                  <div>
                    <p className="text-xl">{game.name}</p>
                    <p className="text-slate-400 text-sm font-normal">{game.tagline}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enabled Toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <Label className="text-white">Game Enabled</Label>
                    <p className="text-slate-400 text-sm">Allow players to access this game</p>
                  </div>
                  <Switch
                    checked={game.enabled}
                    onCheckedChange={(checked) => updateGameMutation.mutate({ 
                      gameId: game.id, 
                      updates: { enabled: checked } 
                    })}
                  />
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <Label className="text-white">Featured Game</Label>
                    <p className="text-slate-400 text-sm">Show in featured section</p>
                  </div>
                  <Switch
                    checked={game.featured}
                    onCheckedChange={(checked) => updateGameMutation.mutate({ 
                      gameId: game.id, 
                      updates: { featured: checked } 
                    })}
                  />
                </div>

                {/* Bet Limits */}
                <div className="space-y-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Betting Limits
                  </h3>
                  
                  <div>
                    <Label className="text-white">Minimum Bet: {game.min_bet}</Label>
                    <Slider
                      value={[game.min_bet || 1]}
                      onValueChange={([val]) => updateGameMutation.mutate({ 
                        gameId: game.id, 
                        updates: { min_bet: val } 
                      })}
                      min={1}
                      max={100}
                      step={1}
                      disabled={!game.enabled}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Maximum Bet: {game.max_bet}</Label>
                    <Slider
                      value={[game.max_bet || 1000]}
                      onValueChange={([val]) => updateGameMutation.mutate({ 
                        gameId: game.id, 
                        updates: { max_bet: val } 
                      })}
                      min={100}
                      max={10000}
                      step={100}
                      disabled={!game.enabled}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Category Badge */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Category</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium">
                      {game.category}
                    </span>
                  </div>
                  {game.coming_soon && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-400 text-sm">Status</span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {games.length === 0 && (
          <div className="text-center py-20">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">No games configured yet</p>
          </div>
        )}
      </div>
    </div>
  );
}