import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function LargeWinningsPreview() {
  const { data: recentWins = [] } = useQuery({
    queryKey: ['recentLargeWins'],
    queryFn: async () => {
      const announcements = await base44.entities.Announcement.filter(
        { type: 'big_win' },
        '-created_date',
        5
      );
      return announcements;
    },
  });

  if (recentWins.length === 0) return null;

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-400" />
            Recent Big Wins (7d)
          </CardTitle>
          <Link to={createPageUrl('LargeWinnings')}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentWins.map((win, idx) => (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎉</span>
                <div>
                  <p className="text-white font-semibold text-sm">{win.display_name}</p>
                  <p className="text-slate-500 text-xs">{win.game_name} • {moment(win.created_date).fromNow()}</p>
                </div>
              </div>
              <p className="text-green-400 font-bold">+{win.amount.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}