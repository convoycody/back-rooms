import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Trophy, Lock, Unlock } from 'lucide-react';
import moment from 'moment';

export default function ScratchersMetrics() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const { data: allCards = [], isLoading } = useQuery({
    queryKey: ['allScratchCards'],
    queryFn: () => base44.entities.ScratchCard.list('-created_date', 500),
    enabled: player?.is_admin || currentUser?.role === 'admin',
  });

  const { data: pools = [] } = useQuery({
    queryKey: ['scratchPools'],
    queryFn: () => base44.entities.ScratchCardPool.list('-period_start'),
    enabled: player?.is_admin || currentUser?.role === 'admin',
  });

  const { data: rarePrizeAnnouncements = [] } = useQuery({
    queryKey: ['rarePrizeAnnouncements'],
    queryFn: () => base44.entities.Announcement.filter({ type: 'rare_prize' }, '-created_date'),
    enabled: player?.is_admin || currentUser?.role === 'admin',
  });

  if (!player?.is_admin && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">Admin privileges required</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const totalSold = allCards.length;
  const totalWagered = totalSold * 1000;
  const totalPaid = allCards.reduce((sum, card) => sum + card.prize, 0);
  const netRevenue = totalWagered - totalPaid;
  const winRate = totalSold > 0 ? (allCards.filter(c => c.is_winner).length / totalSold * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            🎫 Scratchers Metrics
          </h1>
          <p className="text-slate-400 mt-2">Monitor scratch card performance and rare prize pools</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Cards Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-white">{totalSold.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Wagered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-amber-400">{totalWagered.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-400">{totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Net Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-black ${netRevenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netRevenue >= 0 ? '+' : ''}{netRevenue.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1">Win Rate: {winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Prize Pools */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              Rare Prize Pools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pools.map((pool) => {
                const isActive = !pool.is_awarded && new Date(pool.period_end) > new Date();
                const isExpired = new Date(pool.period_end) < new Date();
                
                return (
                  <div key={pool.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <Unlock className="w-5 h-5 text-green-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-600" />
                      )}
                      <div>
                        <p className="text-white font-semibold">
                          {pool.pool_type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {moment(pool.period_start).format('MMM D')} - {moment(pool.period_end).format('MMM D, YYYY')}
                        </p>
                        {pool.is_awarded && (
                          <p className="text-green-400 text-xs mt-1">
                            Won by {pool.awarded_to_player_id} on {moment(pool.awarded_at).format('MMM D')}
                          </p>
                        )}
                        {isExpired && !pool.is_awarded && (
                          <p className="text-amber-400 text-xs mt-1">Expired - no winner</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-purple-400">
                        {pool.prize_amount.toLocaleString()}
                      </p>
                      <Badge className={
                        isActive 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : pool.is_awarded
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }>
                        {isActive ? 'Active' : pool.is_awarded ? 'Awarded' : 'Expired'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rare Prize Winners */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Rare Prize History</CardTitle>
          </CardHeader>
          <CardContent>
            {rarePrizeAnnouncements.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No rare prizes awarded yet</p>
            ) : (
              <div className="space-y-3">
                {rarePrizeAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-white font-semibold">{announcement.display_name}</p>
                      <p className="text-slate-400 text-sm">{announcement.message}</p>
                      <p className="text-slate-500 text-xs">{moment(announcement.created_date).format('MMM D, YYYY h:mm A')}</p>
                    </div>
                    <p className="text-purple-400 font-black text-xl">
                      {announcement.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}