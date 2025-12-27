import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Zap, CheckCircle2, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function BTCStore() {
  const [selectedPack, setSelectedPack] = useState(null);
  const [creating, setCreating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
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

  const { data: btcPacks = [], isLoading: packsLoading } = useQuery({
    queryKey: ['btcPointsPacks'],
    queryFn: () => base44.entities.PointsPack.filter({ 
      enabled: true, 
      purchase_type: 'btc' 
    }, 'sort_order'),
  });

  const { data: myInvoices = [] } = useQuery({
    queryKey: ['myInvoices', player?.id],
    queryFn: () => base44.entities.CryptoInvoice.filter(
      { player_id: player.id },
      '-created_date',
      20
    ),
    enabled: !!player,
    refetchInterval: 5000, // Poll every 5s for status updates
  });

  const handleBuyPack = async (pack) => {
    setSelectedPack(pack);
    setCreating(true);
    setCheckoutUrl(null);
    setCurrentInvoiceId(null);

    try {
      const response = await base44.functions.invoke('createBTCPayInvoice', {
        pack_id: pack.id
      });

      if (response.data.success) {
        setCheckoutUrl(response.data.checkout_url);
        setCurrentInvoiceId(response.data.invoice_id);
        
        // Open BTCPay checkout in new window
        window.open(response.data.checkout_url, '_blank', 'width=800,height=800');
        
        // Start polling for this invoice
        queryClient.invalidateQueries({ queryKey: ['myInvoices'] });
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'created':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" /> Awaiting Payment</Badge>;
      case 'processing':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Confirming</Badge>;
      case 'settled':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'expired':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (userLoading || packsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Casino')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500" />
              Buy Points with Bitcoin
            </h1>
            <p className="text-slate-400">Instant points via Lightning or on-chain BTC</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold mb-1">Pay with Bitcoin or Lightning Network</p>
              <p className="text-amber-300/80">
                Points are credited instantly after payment confirmation. 
                All purchases are for entertainment only with no cash value.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Available Packs */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Available Packs</h2>
            
            {btcPacks.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">No BTC packs available</p>
                  <p className="text-slate-500 text-sm mt-2">Check back later or contact an admin</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {btcPacks.map((pack) => (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700/50 hover:border-amber-500/30 transition-all h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-3xl">{pack.icon || '⚡'}</span>
                          <div>
                            <p className="text-white">{pack.name}</p>
                            <p className="text-2xl font-black text-amber-400">
                              {pack.points_amount.toLocaleString()} pts
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-400 text-sm mb-4">{pack.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-slate-500 text-sm">Price:</span>
                          <span className="text-white font-bold text-lg">${pack.price_usd?.toFixed(2)}</span>
                        </div>
                        <Button
                          onClick={() => handleBuyPack(pack)}
                          disabled={creating}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold"
                        >
                          {creating && selectedPack?.id === pack.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Creating Invoice...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Pay with BTC
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Purchases */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Invoices</h2>
            <div className="space-y-3">
              {myInvoices.slice(0, 10).map((invoice) => {
                const pack = btcPacks.find(p => p.id === invoice.pack_id);
                return (
                  <Card key={invoice.id} className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">
                            {pack?.name || 'Pack'}
                          </p>
                          <p className="text-amber-400 font-bold text-xs">
                            {invoice.amount_usd ? `$${invoice.amount_usd.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <p className="text-slate-500 text-xs mb-2">
                        {moment(invoice.created_date).fromNow()}
                      </p>

                      {invoice.status === 'created' && invoice.checkout_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(invoice.checkout_url, '_blank')}
                          className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open Checkout
                        </Button>
                      )}

                      {invoice.status === 'settled' && invoice.points_credited && (
                        <div className="text-green-400 text-xs flex items-center gap-1 mt-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Points credited
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {myInvoices.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No invoices yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={!!checkoutUrl} onOpenChange={(open) => !open && setCheckoutUrl(null)}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Payment Window Opened</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">Waiting for payment...</p>
                  <p className="text-amber-300/80">
                    Complete your payment in the BTCPay window. Points will be added automatically after confirmation.
                  </p>
                </div>
              </div>

              {checkoutUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(checkoutUrl, '_blank')}
                  className="w-full border-amber-500/50 text-amber-400"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Reopen Payment Window
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setCheckoutUrl(null)}
                className="w-full text-slate-400"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}