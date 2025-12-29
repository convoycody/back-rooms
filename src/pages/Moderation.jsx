import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Ban, Clock, Shield, MessageSquare } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Moderation() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [reason, setReason] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);
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

  const { data: messages = [] } = useQuery({
    queryKey: ['allChatMessages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 100),
  });

  const { data: moderationActions = [] } = useQuery({
    queryKey: ['moderationActions'],
    queryFn: () => base44.entities.ModerationAction.list('-created_date', 50),
  });

  const moderateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('moderateChat', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allChatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['moderationActions'] });
      setSelectedPlayer(null);
      setReason('');
      toast.success('Moderation action completed');
    },
  });

  const handleDeleteMessage = (messageId, playerId) => {
    moderateMutation.mutate({
      action_type: 'delete_message',
      target_player_id: playerId,
      message_id: messageId,
      reason: 'Message deleted by moderator'
    });
  };

  const handleTimeout = () => {
    if (!selectedPlayer) return;
    moderateMutation.mutate({
      action_type: 'timeout',
      target_player_id: selectedPlayer,
      duration_minutes: timeoutMinutes,
      reason
    });
  };

  const handleBan = () => {
    if (!selectedPlayer) return;
    moderateMutation.mutate({
      action_type: 'ban',
      target_player_id: selectedPlayer,
      reason
    });
  };

  if (!player?.is_admin && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            Chat Moderation
          </h1>
          <p className="text-slate-400 mt-2">Manage chat messages and user behavior</p>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1 mb-6">
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="actions">Moderation Log</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        msg.is_deleted ? 'bg-red-500/5 border-red-500/30' : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {msg.display_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold">{msg.display_name}</span>
                          <span className="text-slate-500 text-xs">{moment(msg.created_date).fromNow()}</span>
                          {msg.is_deleted && <Badge variant="destructive">Deleted</Badge>}
                        </div>
                        <p className="text-slate-300">{msg.message}</p>
                      </div>
                      {!msg.is_deleted && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMessage(msg.id, msg.player_id)}
                            disabled={moderateMutation.isPending}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedPlayer(msg.player_id)}
                                className="text-amber-400 hover:text-amber-300"
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Timeout User</DialogTitle>
                                <DialogDescription>
                                  Temporarily restrict {msg.display_name} from sending messages
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-white text-sm mb-2 block">Duration (minutes)</label>
                                  <Input
                                    type="number"
                                    value={timeoutMinutes}
                                    onChange={(e) => setTimeoutMinutes(parseInt(e.target.value) || 10)}
                                    min="1"
                                    max="1440"
                                    className="bg-slate-800 border-slate-700 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-white text-sm mb-2 block">Reason</label>
                                  <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Optional reason"
                                    className="bg-slate-800 border-slate-700 text-white"
                                  />
                                </div>
                                <Button
                                  onClick={handleTimeout}
                                  disabled={moderateMutation.isPending}
                                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                                >
                                  Timeout {timeoutMinutes} minutes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedPlayer(msg.player_id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Ban User</DialogTitle>
                                <DialogDescription>
                                  Permanently ban {msg.display_name} from chat
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-white text-sm mb-2 block">Reason</label>
                                  <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Required"
                                    className="bg-slate-800 border-slate-700 text-white"
                                  />
                                </div>
                                <Button
                                  onClick={handleBan}
                                  disabled={!reason || moderateMutation.isPending}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  Permanently Ban
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Moderation Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moderationActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <p className="text-white font-semibold">
                          {action.moderator_name} {action.action_type.replace('_', ' ')} {action.target_player_name}
                        </p>
                        {action.reason && <p className="text-slate-400 text-sm">{action.reason}</p>}
                        <p className="text-slate-500 text-xs mt-1">{moment(action.created_date).fromNow()}</p>
                      </div>
                      {action.expires_at && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Expires {moment(action.expires_at).fromNow()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}