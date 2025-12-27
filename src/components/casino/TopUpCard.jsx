import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, Loader2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopUpCard({ playerId, balance, onTopUp }) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0];
    }
  });

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId
  });

  const handleTopUp = async () => {
    if (!config?.topup_enabled) return;
    
    setClaiming(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('claimTopUp', {});
      
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['player'] });
        onTopUp?.(response.data.amount);
      } else if (response.data.error) {
        setError(response.data);
      }
    } catch (err) {
      console.error('Top-up error:', err);
      setError({ error: err.response?.data?.error || 'Failed to claim top-up' });
    } finally {
      setClaiming(false);
    }
  };

  if (!config?.topup_enabled) {
    return null;
  }

  const eligible = balance < config.topup_threshold;
  
  // Calculate remaining top-ups today
  const indyTime = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Indiana/Indianapolis' 
  });
  const indyDate = new Date(indyTime);
  const todayKey = indyDate.toISOString().split('T')[0];
  
  const topupCount = player?.last_topup_date === todayKey ? (player?.topup_count_today || 0) : 0;
  const remaining = config.topup_max_per_day - topupCount;

  if (!eligible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-400 font-semibold">Low Balance!</p>
                  <p className="text-slate-400 text-xs">
                    {remaining > 0 ? `${remaining} top-up${remaining !== 1 ? 's' : ''} left today` : 'Daily limit reached'}
                  </p>
                </div>
              </div>
              
              {remaining > 0 && (
                <Button
                  onClick={handleTopUp}
                  disabled={claiming}
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold"
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `+${config.topup_amount}`
                  )}
                </Button>
              )}
            </div>
            
            {error && (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>
                  {error.wait_minutes 
                    ? `Wait ${error.wait_minutes} min${error.wait_minutes !== 1 ? 's' : ''}` 
                    : error.error}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}