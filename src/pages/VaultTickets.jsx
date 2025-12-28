import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Ticket, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TicketCard from '@/components/vault/TicketCard';

export default function VaultTickets() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('active');

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

  const { data: poolTickets = [], isLoading: poolLoading } = useQuery({
    queryKey: ['poolTickets', player?.id, filter],
    queryFn: async () => {
      const tickets = await base44.entities.PoolTicket.filter(
        { player_id: player.id },
        '-created_date'
      );
      if (filter === 'all') return tickets;
      return tickets.filter(t => t.status === filter);
    },
    enabled: !!player,
  });

  const { data: lotteryTickets = [], isLoading: lotteryLoading } = useQuery({
    queryKey: ['lotteryTickets', player?.id, filter],
    queryFn: async () => {
      const tickets = await base44.entities.LotteryTicket.filter(
        { player_id: player.id },
        '-created_date'
      );
      if (filter === 'all') return tickets;
      return tickets.filter(t => t.status === filter);
    },
    enabled: !!player,
  });

  const { data: poolDraws = [] } = useQuery({
    queryKey: ['poolDraws'],
    queryFn: () => base44.entities.PoolDraw.list('-created_date', 100),
  });

  const { data: lotteryDraws = [] } = useQuery({
    queryKey: ['lotteryDraws'],
    queryFn: () => base44.entities.LotteryDraw.list('-created_date', 100),
  });

  if (!currentUser || !player || poolLoading || lotteryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const allTickets = [
    ...poolTickets.map(t => ({ ...t, type: 'pool', draw: poolDraws.find(d => d.id === t.draw_id) })),
    ...lotteryTickets.map(t => ({ ...t, type: 'lottery', draw: lotteryDraws.find(d => d.id === t.draw_id) }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl('Wallet'))}
            variant="ghost"
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wallet
          </Button>
          
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-purple-400" />
            My Vault Tickets
          </h1>
          <p className="text-slate-400">View all your lottery and pool tickets</p>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="won">Won</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {allTickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No tickets yet</p>
            <p className="text-slate-500 text-sm mt-2">Purchase tickets from the Vault Games</p>
            <div className="flex gap-4 justify-center mt-6">
              <Button
                onClick={() => navigate(createPageUrl('PoolGame'))}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
              >
                Play 50/50 Pool
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('LotteryGame'))}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold"
              >
                Play Lottery
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTickets.map((ticket) => (
              <TicketCard
                key={`${ticket.type}-${ticket.id}`}
                ticket={ticket}
                draw={ticket.draw}
                type={ticket.type}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}