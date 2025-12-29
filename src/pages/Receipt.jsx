import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Hash, Copy } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function Receipt() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', slug],
    queryFn: async () => {
      // Try announcements first
      const announcements = await base44.entities.Announcement.filter({ share_slug: slug });
      if (announcements.length > 0) {
        return { type: 'announcement', data: announcements[0] };
      }
      
      // Try ledger entries
      const ledgers = await base44.entities.Ledger.filter({ share_slug: slug });
      if (ledgers.length > 0) {
        const ledger = ledgers[0];
        const players = await base44.entities.Player.filter({ id: ledger.player_id });
        const player = players[0];
        
        const settings = await base44.entities.PlayerSettings.filter({ player_id: ledger.player_id });
        const isPublic = settings[0]?.allow_public_receipts !== false;
        
        return {
          type: 'ledger',
          data: {
            ...ledger,
            display_name: isPublic ? player?.display_name : 'Anonymous Player',
            referral_code: player?.referral_code
          }
        };
      }
      
      return null;
    },
    enabled: !!slug,
  });

  const announcement = receipt?.type === 'announcement' ? receipt.data : null;
  const ledger = receipt?.type === 'ledger' ? receipt.data : null;

  const copyLink = () => {
    const refCode = announcement?.metadata?.referral_code || ledger?.referral_code;
    const url = `${window.location.href}${refCode ? `?ref=${refCode}` : ''}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied with referral code!');
  };

  const playGame = () => {
    const refCode = announcement?.metadata?.referral_code || ledger?.referral_code;
    const gameId = announcement?.game_id;
    
    if (gameId) {
      navigate(`/games/${gameId}${refCode ? `?ref=${refCode}` : ''}`);
    } else {
      navigate(createPageUrl('Home') + `${refCode ? `?ref=${refCode}` : ''}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Receipt Not Found</h1>
          <p className="text-slate-400">This receipt does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const displayAmount = announcement?.amount || Math.abs(ledger?.change || 0);
  const displayName = announcement?.display_name || ledger?.display_name || 'Anonymous Player';
  const displayGame = announcement?.game_name || 'Game';
  const displayMultiplier = announcement?.multiplier;
  const displayDate = announcement?.created_date || ledger?.created_date;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="bg-slate-900/90 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-3xl">🧾</span>
              Win Receipt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Amount */}
            <div className="text-center py-6 border-y border-slate-800">
              <p className="text-slate-400 text-sm mb-2">
                {ledger && ledger.change < 0 ? 'Amount Lost' : 'Amount Won'}
              </p>
              <p className={`text-6xl font-black bg-gradient-to-r ${
                ledger && ledger.change < 0 
                  ? 'from-red-400 to-red-600' 
                  : 'from-green-400 to-emerald-400'
              } bg-clip-text text-transparent`}>
                {ledger && ledger.change < 0 ? '-' : '+'}{displayAmount.toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm mt-1">points</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Transaction ID
                </span>
                <span className="text-white font-mono text-sm">
                  {(announcement?.id || ledger?.id || '').substring(0, 12)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Game</span>
                <span className="text-white font-semibold">{displayGame}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Player</span>
                <span className="text-white">{displayName}</span>
              </div>

              {displayMultiplier && (
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <span className="text-slate-400">Multiplier</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {displayMultiplier.toFixed(2)}x
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </span>
                <span className="text-white text-sm">{moment(displayDate).format('MMM D, YYYY h:mm A')}</span>
              </div>

              {ledger?.note && (
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <span className="text-slate-400">Note</span>
                  <span className="text-white text-sm">{ledger.note}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={playGame} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold">
                Play Now
              </Button>
              <Button onClick={copyLink} variant="outline" className="border-slate-600">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>

            <p className="text-slate-500 text-xs text-center">
              Entertainment platform using fictional points only. No real money gambling.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}