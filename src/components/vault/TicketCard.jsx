import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Clock, Trophy, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TicketCard({ ticket, draw, type }) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'active':
        return <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md">Active</span>;
      case 'won':
        return <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-md">Won</span>;
      case 'lost':
        return <span className="text-xs px-2 py-1 bg-slate-500/20 text-slate-400 rounded-md">Lost</span>;
      case 'refunded':
        return <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md">Refunded</span>;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'won':
        return <Trophy className="w-5 h-5 text-green-400" />;
      case 'lost':
        return <XCircle className="w-5 h-5 text-slate-400" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const drawTime = draw?.draw_at ? new Date(draw.draw_at) : null;
  const isUpcoming = drawTime && drawTime > new Date();

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {type === 'pool' ? '🎫' : '🎰'}
            </div>
            <div>
              <p className="text-white font-bold">
                {type === 'pool' ? '50/50 Pool' : 'Vault Lottery'}
              </p>
              <p className="text-slate-400 text-xs">
                Ticket #{ticket.ticket_number}
              </p>
            </div>
          </div>
          {getStatusIcon()}
        </div>

        {type === 'lottery' && ticket.numbers && (
          <div className="mb-3 flex flex-wrap gap-2">
            {ticket.numbers.map((num, idx) => (
              <div key={idx} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                {num}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black text-sm font-bold">
              {ticket.power_number}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          {getStatusBadge()}
          {ticket.status === 'won' && ticket.payout_amount && (
            <p className="text-green-400 font-bold">
              +{ticket.payout_amount.toLocaleString()}
            </p>
          )}
        </div>

        {isUpcoming && draw ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-3">
            <p className="text-blue-300 text-xs">
              <Clock className="w-3 h-3 inline mr-1" />
              Draw {formatDistanceToNow(drawTime, { addSuffix: true })}
            </p>
          </div>
        ) : draw?.status === 'executed' ? (
          <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
            <p className="text-slate-400 text-xs">
              Draw completed
            </p>
          </div>
        ) : null}

        <Button
          onClick={() => navigate(createPageUrl('TicketDetail') + `?id=${ticket.id}&type=${type}`)}
          variant="outline"
          size="sm"
          className="w-full border-slate-600 text-slate-300"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}