import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function MomentumTracker({ race, entries, horses, playerId, config }) {
  const queryClient = useQueryClient();
  const [cooldown, setCooldown] = useState(false);

  const myEntry = entries.find(e => e.owner_id === playerId);
  const myHorse = myEntry ? horses.find(h => h.id === myEntry.horse_id) : null;

  const submitProofMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitMomentumProof', {
        race_id: race.id,
        entry_id: myEntry.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raceEntries'] });
      toast.success('Momentum boost applied! ⚡');
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit proof');
    },
  });

  if (!myEntry) return null;

  const totalProofs = entries.reduce((sum, e) => sum + (e.momentum_proofs || 0), 0);
  const myProofs = myEntry.momentum_proofs || 0;
  const myScore = myEntry.momentum_score || 0;
  const maxImpact = config?.momentum_impact_cap || 8;

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Your Momentum
          </h3>
          <div className="text-right">
            <p className="text-purple-300 text-sm">Proofs</p>
            <p className="text-white font-bold text-xl">{myProofs}</p>
          </div>
        </div>

        {myHorse && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-lg">
            <span className="text-3xl">{myHorse.avatar_emoji}</span>
            <div className="flex-1">
              <p className="text-white font-semibold">{myHorse.horse_name}</p>
              <p className="text-slate-400 text-sm">Your horse in this race</p>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Momentum Score</span>
            <span className="text-purple-300 font-bold">{myScore.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(myScore / maxImpact) * 100}%` }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            />
          </div>
          <p className="text-slate-500 text-xs">
            Up to +{maxImpact}% boost to win chance
          </p>
        </div>

        <Button
          onClick={() => submitProofMutation.mutate()}
          disabled={submitProofMutation.isPending || cooldown || race.status !== 'running'}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {submitProofMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cooldown ? (
            'Cooldown...'
          ) : race.status !== 'running' ? (
            'Race Not Active'
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Submit Proof
            </>
          )}
        </Button>

        {totalProofs > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-700/50">
            <p className="text-slate-400 text-xs mb-2">All Entries</p>
            <div className="space-y-1">
              {entries.map((entry) => {
                const horse = horses.find(h => h.id === entry.horse_id);
                if (!horse) return null;
                return (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">
                      {horse.avatar_emoji} {horse.horse_name}
                    </span>
                    <span className="text-purple-400 font-mono">
                      {entry.momentum_proofs || 0} proofs
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}