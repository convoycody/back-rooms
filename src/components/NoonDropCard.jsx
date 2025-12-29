import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NoonDropCard() {
  const { data: houseConfig } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0];
    },
  });

  const { data: todaysDraw } = useQuery({
    queryKey: ['noonDropToday'],
    queryFn: async () => {
      const now = new Date();
      const etDateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now).split('/').reverse().join('-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$3-$2');
      
      const draws = await base44.entities.NoonDropDraw.filter({ 
        draw_date: etDateStr,
        status: 'executed'
      });
      return draws[0] || null;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (!houseConfig?.noon_drop_enabled) {
    return null;
  }

  const prizeAmount = houseConfig?.noon_drop_prize || 1000000;
  const isComplete = todaysDraw?.status === 'executed';

  // Calculate time until noon ET
  const now = new Date();
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const noonET = new Date(etNow);
  noonET.setHours(12, 0, 0, 0);
  
  if (etNow > noonET && !isComplete) {
    noonET.setDate(noonET.getDate() + 1);
  }
  
  const timeUntilDraw = noonET - etNow;
  const hours = Math.floor(timeUntilDraw / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilDraw % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-400/30 overflow-hidden relative w-full">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 animate-pulse" />
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent font-black">
            The Noon Drop
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">Draw Complete!</span>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-amber-400/20">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">Today's Winner</div>
                <div className="text-lg sm:text-xl font-black text-white mb-2 break-all">
                  {todaysDraw?.winner_display_name || 'Anonymous'}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xl sm:text-2xl font-black text-amber-400 break-all">
                    {typeof prizeAmount === 'number' ? prizeAmount.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'} points
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-slate-500 text-center">
                Next draw tomorrow at 12:00 PM ET
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-sm text-slate-300">Next Draw</span>
                </div>
                <Badge variant="outline" className="bg-amber-500/20 border-amber-400/30 text-amber-300">
                  {hours}h {minutes}m
                </Badge>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-amber-400/20 text-center">
                <div className="text-xs sm:text-sm text-slate-400 mb-2">Prize Pool</div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent break-all">
                    {typeof prizeAmount === 'number' ? prizeAmount.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">points</div>
              </div>
              
              <div className="text-xs text-slate-400 text-center space-y-1">
                <div>✓ All active players automatically entered</div>
                <div>✓ Fully random • No controls • Verifiable</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
