import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';
import VIPBadge from '@/components/VIPBadge';

export default function ChatSidebar({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages'],
    queryFn: () => base44.entities.ChatMessage.filter({ is_deleted: false }, '-created_date', 50),
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const { data: settings } = useQuery({
    queryKey: ['playerSettings', player?.id],
    queryFn: async () => {
      if (!player) return null;
      const results = await base44.entities.PlayerSettings.filter({ player_id: player.id });
      return results[0] || null;
    },
    enabled: !!player,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageText) => base44.functions.invoke('sendChatMessage', { message: messageText }),
    onSuccess: () => {
      setMessage('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || 'Failed to send message';
      setError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    if (message.length > 500) {
      setError('Message too long');
      return;
    }
    sendMessageMutation.mutate(message);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isBanned = settings?.chat_banned;
  const isTimedOut = settings?.chat_timeout_until && new Date(settings.chat_timeout_until) > new Date();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold">🚪 The Back Rooms</h2>
                <p className="text-slate-400 text-xs">Global chat</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500 text-sm">No messages yet. Be the first!</p>
                </div>
              ) : (
                messages.reverse().map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                      {msg.avatar_url ? (
                        <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        msg.display_name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">{msg.display_name}</span>
                        {msg.vip_tier > 0 && <VIPBadge tier={msg.vip_tier} size="sm" />}
                        <span className="text-slate-500 text-xs">{moment(msg.created_date).fromNow()}</span>
                      </div>
                      <p className="text-slate-300 text-sm break-words">{msg.message}</p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800">
              {isBanned ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-red-400 text-sm font-semibold">You are banned from chat</p>
                </div>
              ) : isTimedOut ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-amber-400 text-sm font-semibold">
                    Timed out until {moment(settings.chat_timeout_until).format('h:mm A')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {error && (
                    <p className="text-red-400 text-xs">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      maxLength={500}
                      className="bg-slate-800 border-slate-700 text-white"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-slate-500 text-xs">{message.length}/500</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}