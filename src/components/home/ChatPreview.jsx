import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users } from 'lucide-react';
import moment from 'moment';
import VIPBadge from '@/components/VIPBadge';

export default function ChatPreview({ onOpenChat }) {
  const { data: messages = [] } = useQuery({
    queryKey: ['recentChatMessages'],
    queryFn: () => base44.entities.ChatMessage.filter({ is_deleted: false }, '-created_date', 3),
    refetchInterval: 5000,
  });

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            The Back Rooms
          </CardTitle>
          <Button onClick={onOpenChat} size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
            Join Chat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.reverse().map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                  {msg.avatar_url ? (
                    <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    msg.display_name[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm">{msg.display_name}</span>
                    {msg.vip_tier > 0 && <VIPBadge tier={msg.vip_tier} size="sm" />}
                    <span className="text-slate-500 text-xs">{moment(msg.created_date).fromNow()}</span>
                  </div>
                  <p className="text-slate-300 text-sm truncate">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}