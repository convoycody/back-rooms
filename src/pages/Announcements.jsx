import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Trophy, Sparkles, AlertCircle, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'sonner';

export default function Announcements() {
  const [filter, setFilter] = useState('all');

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 100),
  });

  const getTypeIcon = (type) => {
    if (type === 'big_win') return '🎉';
    if (type === 'rare_prize') return '🌟';
    if (type === 'jackpot') return '💰';
    if (type === 'system') return '📢';
    return '🎲';
  };

  const getTypeBadge = (type) => {
    if (type === 'big_win') return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Big Win</Badge>;
    if (type === 'rare_prize') return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Rare Prize</Badge>;
    if (type === 'jackpot') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Jackpot</Badge>;
    if (type === 'system') return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">System</Badge>;
    return null;
  };

  const copyShareLink = (slug) => {
    const url = `${window.location.origin}/#/announcements/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(a => a.type === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            📢 Announcements
          </h1>
          <p className="text-slate-400 mt-2">Big wins, rare prizes, and platform updates</p>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="big_win">Big Wins</TabsTrigger>
            <TabsTrigger value="rare_prize">Rare Prizes</TabsTrigger>
            <TabsTrigger value="jackpot">Jackpots</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement, idx) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{getTypeIcon(announcement.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeBadge(announcement.type)}
                            <span className="text-slate-500 text-xs">
                              {moment(announcement.created_date).fromNow()}
                            </span>
                          </div>
                          <p className="text-white text-lg mb-2">{announcement.message}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>Game: {announcement.game_name}</span>
                            {announcement.multiplier && (
                              <span>Multiplier: {announcement.multiplier.toFixed(2)}x</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyShareLink(announcement.share_slug)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}