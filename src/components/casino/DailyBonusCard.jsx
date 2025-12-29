import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, Clock, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DailyBonusCard({ playerId, onClaimed }) {
  const [claiming, setClaiming] = useState(false);
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['houseConfig'],
    queryFn: async () => {
      const configs = await base44.entities.HouseConfig.list();
      return configs[0];
    }
  });

  const handleClaim = async () => {
    if (!config?.daily_bonus_enabled) return;
    
    setClaiming(true);
    try {
      const response = await base44.functions.invoke('claimDailyBonus', {});
      
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['player'] });
        queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
        onClaimed?.(response.data.amount);
        
        // Track activity
        try {
          await base44.functions.invoke('trackActivity', { player_id: playerId });
        } catch (err) {
          console.error('Activity tracking failed:', err);
        }
        
        setShowReferralPrompt(true);
        
        if (response.data.vip_bonus > 0) {
          toast.success(
            `Claimed ${response.data.amount.toLocaleString()} points! (${response.data.base_amount.toLocaleString()} + ${response.data.vip_bonus.toLocaleString()} VIP bonus)`,
            { duration: 4000 }
          );
        } else {
          toast.success(`Claimed ${response.data.amount.toLocaleString()} points!`);
        }
      }
    } catch (error) {
      console.error('Claim error:', error);
      if (error.response?.data?.already_claimed) {
        toast.error('Already claimed today');
      } else {
        toast.error('Failed to claim bonus');
      }
    } finally {
      setClaiming(false);
    }
  };

  // Check if eligible to claim
  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId
  });

  // Get today's date in Eastern Time (matching backend)
  const today = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Indiana/Indianapolis',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split(',')[0].split('/');
  const todayKey = `${today[2]}-${today[0].padStart(2, '0')}-${today[1].padStart(2, '0')}`;
  
  const alreadyClaimed = player?.daily_last_claim_date === todayKey;

  // Calculate next eligible time
  const indyTime = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Indiana/Indianapolis' 
  });
  const indyDate = new Date(indyTime);
  const tomorrow = new Date(indyDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (!config?.daily_bonus_enabled) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="w-5 h-5 text-purple-400" />
            Daily Bonus
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative">
          {alreadyClaimed && !showReferralPrompt ? (
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
              <p className="text-green-400 font-semibold">Claimed Today!</p>
              <p className="text-slate-400 text-sm flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Next: {moment(tomorrow).fromNow()}
              </p>
            </div>
          ) : showReferralPrompt ? (
            <div className="text-center space-y-3">
              <Share2 className="w-12 h-12 mx-auto text-purple-400" />
              <p className="text-white font-semibold">Invite friends & earn more!</p>
              <p className="text-slate-400 text-sm">Get 10,000 points instantly + 25,000 more after they play 10 games</p>
              <Link to={createPageUrl('Referrals')}>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold">
                  Share Referral Link
                </Button>
              </Link>
              <button 
                onClick={() => setShowReferralPrompt(false)}
                className="text-slate-500 text-xs hover:text-slate-400"
              >
                Maybe later
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Claim your daily gift</p>
                <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {(() => {
                    const vipTier = player?.vip_tier || 0;
                    const vipMultipliers = [1.0, 1.1, 1.2, 1.35, 1.5, 1.75];
                    const multiplier = vipMultipliers[vipTier] || 1.0;
                    const amount = Math.floor((config.daily_bonus_amount || 10000) * multiplier);
                    return amount.toLocaleString();
                  })()}
                </p>
                <p className="text-slate-400 text-xs">
                  points
                  {player?.vip_tier > 0 && (
                    <span className="text-purple-400 ml-1">
                      (VIP Tier {player.vip_tier} bonus!)
                    </span>
                  )}
                </p>
              </div>
              
              <Button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-lg py-6"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Claim Now
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
