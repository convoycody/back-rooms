import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, ArrowLeft, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import VIPBadge from '@/components/VIPBadge';

export default function LargeWinnings() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['largeWinnings', timeRange],
    queryFn: async () => {
      const all = await base44.entities.Announcement.filter(
        { type: 'big_win' },
        '-created_date',
        200
      );

      // Filter by time range
      const now = new Date();
      const cutoffDates = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        'all': new Date(0)
      };

      return all.filter(a => new Date(a.created_date) >= cutoffDates[timeRange]);
    },
  });

  const { data: jackpots = [] } = useQuery({
    queryKey: ['jackpotWins'],
    queryFn: () => base44.entities.Announcement.filter({ type: 'jackpot' }, '-created_date', 50),
  });

  const { data: rarePrizes = [] } = useQuery({
    queryKey: ['rarePrizes'],
    queryFn: () => base44.entities.Announcement.filter({ type: 'rare_prize' }, '-created_date', 50),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const WinCard = ({ announcement, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.03 }}
    >
      <Card className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-black w-12 text-center">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold">{announcement.display_name}</span>
                {announcement.metadata?.vip_tier > 0 && (
                  <VIPBadge tier={announcement.metadata.vip_tier} size="sm" />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">{announcement.game_name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500">{moment(announcement.created_date).fromNow()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-black text-xl">
                +{announcement.amount.toLocaleString()}
              </p>
              {announcement.multiplier && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mt-1">
                  {announcement.multiplier.toFixed(1)}x
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
            💰 Large Winnings
          </h1>
          <p className="text-slate-400 mt-2">Biggest wins across all games</p>
        </div>

        <Tabs value={timeRange} onValueChange={setTimeRange} className="mb-6">
          <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1">
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Jackpots Section */}
        {jackpots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              💰 Jackpot Winners
            </h2>
            <div className="space-y-3">
              {jackpots.slice(0, 10).map((announcement, idx) => (
                <WinCard key={announcement.id} announcement={announcement} rank={idx + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Rare Prizes Section */}
        {rarePrizes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🌟 Rare Prize Winners
            </h2>
            <div className="space-y-3">
              {rarePrizes.slice(0, 10).map((announcement, idx) => (
                <WinCard key={announcement.id} announcement={announcement} rank={idx + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Big Wins */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Big Wins ({timeRange})
          </h2>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No large winnings in this period yet</p>
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement, idx) => (
                <WinCard key={announcement.id} announcement={announcement} rank={idx + 1} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}