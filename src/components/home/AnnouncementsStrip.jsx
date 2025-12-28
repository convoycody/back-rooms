import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';
import moment from 'moment';
import { motion } from 'framer-motion';

export default function AnnouncementsStrip() {
  const { data: announcements = [] } = useQuery({
    queryKey: ['recentAnnouncements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 5),
  });

  if (announcements.length === 0) return null;

  const getTypeIcon = (type) => {
    if (type === 'big_win') return '🎉';
    if (type === 'rare_prize') return '🌟';
    if (type === 'jackpot') return '💰';
    if (type === 'system') return '📢';
    return '🎲';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Latest Wins</h2>
        <Link to={createPageUrl('Announcements')}>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      <div className="space-y-2">
        {announcements.map((announcement, idx) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{announcement.message}</p>
                    <p className="text-slate-500 text-xs">{moment(announcement.created_date).fromNow()}</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm whitespace-nowrap">
                    +{announcement.amount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}