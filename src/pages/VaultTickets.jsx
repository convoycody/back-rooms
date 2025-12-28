import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function VaultTickets() {
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

  const { data: fiftyTickets = [] } = useQuery({
    queryKey: ['fiftyTickets', player?.id],
    queryFn: () => base44.entities.FiftyFiftyTicket.filter({ player_id: player.id }, '-created_date'),
    enabled: !!player,
  });

  const { data: numbersTickets = [] } = useQuery({
    queryKey: ['numbersTickets', player?.id],
    queryFn: () => base44.entities.NumbersLotteryTicket.filter({ player_id: player.id }, '-created_date'),
    enabled: !!player,
  });

  const tickets = [...fiftyTickets, ...numbersTickets];

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Wallet')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Wallet
            </Button>
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            🎫 My Vault Tickets
          </h1>
          <p className="text-slate-400 mt-2">View all your active and past vault tickets</p>
        </div>

        {/* Empty State */}
        {tickets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Tickets Yet</h3>
                <p className="text-slate-400 mb-6">
                  Purchase tickets for vault games to see them here
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to={createPageUrl('GameGallery') + '#vault-games'}>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold">
                      Browse Vault Games
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Display Tickets */}
        {tickets.length > 0 && (
          <div className="space-y-4">
            {/* 50/50 Tickets */}
            {fiftyTickets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  🎯 50/50 Pool Tickets
                </h2>
                <div className="space-y-3">
                  {fiftyTickets.map((ticket) => (
                    <Card key={ticket.id} className="bg-slate-900/50 border-green-700/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">Pool: {ticket.pool_date}</p>
                            <p className="text-slate-400 text-sm">Ticket Price: {ticket.ticket_price.toLocaleString()} pts</p>
                            <p className="text-slate-500 text-xs">{moment(ticket.purchased_at).format('MMM D, YYYY h:mm A')}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              ticket.status === 'won' ? 'bg-green-500/20 text-green-400' :
                              ticket.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                              ticket.status === 'refunded' ? 'bg-slate-500/20 text-slate-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {ticket.status}
                            </span>
                            {ticket.payout > 0 && (
                              <p className="text-green-400 font-bold mt-1">+{ticket.payout.toLocaleString()} pts</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Numbers Lottery Tickets */}
            {numbersTickets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  🎱 Numbers Lottery Tickets
                </h2>
                <div className="space-y-3">
                  {numbersTickets.map((ticket) => (
                    <Card key={ticket.id} className="bg-slate-900/50 border-purple-700/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold mb-2">Draw: {ticket.draw_date}</p>
                            <div className="flex gap-2 mb-2">
                              {ticket.main_numbers.map((num, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                  {num}
                                </div>
                              ))}
                              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black text-sm font-bold">
                                {ticket.power_number}
                              </div>
                            </div>
                            <p className="text-slate-400 text-sm">Price: {ticket.ticket_price.toLocaleString()} pts</p>
                            <p className="text-slate-500 text-xs">{moment(ticket.purchased_at).format('MMM D, YYYY h:mm A')}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              ticket.status === 'winner' ? 'bg-green-500/20 text-green-400' :
                              ticket.status === 'loser' ? 'bg-red-500/20 text-red-400' :
                              ticket.status === 'refunded' ? 'bg-slate-500/20 text-slate-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {ticket.status}
                            </span>
                            {ticket.payout > 0 && (
                              <>
                                <p className="text-green-400 font-bold mt-1">+{ticket.payout.toLocaleString()} pts</p>
                                <p className="text-slate-400 text-xs">{ticket.win_tier}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}