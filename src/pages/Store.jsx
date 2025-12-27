import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Clock, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function Store() {
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

  const { data: packs = [], isLoading: packsLoading } = useQuery({
    queryKey: ['pointsPacks'],
    queryFn: () => base44.entities.PointsPack.filter({ enabled: true }, 'sort_order'),
  });

  const { data: myPurchases = [] } = useQuery({
    queryKey: ['myPurchases', player?.id],
    queryFn: () => base44.entities.PointsPurchase.filter(
      { player_id: player.id },
      '-created_date'
    ),
    enabled: !!player,
  });

  const requestPackMutation = useMutation({
    mutationFn: async (packId) => {
      const pack = packs.find(p => p.id === packId);
      return await base44.entities.PointsPurchase.create({
        player_id: player.id,
        pack_id: packId,
        points_amount: pack.points_amount,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPurchases'] });
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  if (userLoading || packsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
              <ShoppingCart className="w-8 h-8 text-purple-500" />
              Points Store
            </h1>
            <p className="text-slate-400">Request point packs to keep playing</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Entertainment Only</p>
              <p className="text-blue-400">
                These are fictional points with no monetary value. 
                Requests require admin approval. No real money is involved.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Available Packs */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Available Packs</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {packs.map((pack) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-slate-900/50 border-slate-700/50 hover:border-purple-500/30 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-3xl">{pack.icon || '💰'}</span>
                        <div>
                          <p className="text-white">{pack.name}</p>
                          <p className="text-2xl font-black text-purple-400">
                            {pack.points_amount.toLocaleString()} pts
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400 text-sm mb-4">{pack.description}</p>
                      <Button
                        onClick={() => requestPackMutation.mutate(pack.id)}
                        disabled={requestPackMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold"
                      >
                        {requestPackMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Request Pack'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {packs.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No packs available</p>
                  <p className="text-sm">Check back later or contact an admin</p>
                </div>
              )}
            </div>
          </div>

          {/* My Requests */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">My Requests</h2>
            <div className="space-y-3">
              {myPurchases.slice(0, 10).map((purchase) => {
                const pack = packs.find(p => p.id === purchase.pack_id);
                return (
                  <Card key={purchase.id} className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-white">
                            {pack?.name || 'Pack'}
                          </p>
                          <p className="text-purple-400 font-bold">
                            {purchase.points_amount.toLocaleString()} pts
                          </p>
                        </div>
                        {getStatusBadge(purchase.status)}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {moment(purchase.created_date).fromNow()}
                      </p>
                      {purchase.admin_note && (
                        <p className="text-slate-400 text-xs mt-2 italic">
                          "{purchase.admin_note}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {myPurchases.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No requests yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}