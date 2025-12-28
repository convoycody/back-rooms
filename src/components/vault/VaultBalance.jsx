import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowDownToLine, ArrowUpFromLine, Lock, Wallet, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VaultBalance({ spendable, vault, onUpdate }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: async (amount) => {
      const { data } = await base44.functions.invoke('vaultDeposit', { amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast.success('Deposited to vault');
      setDepositAmount('');
      setDepositOpen(false);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast.error(error.message || 'Deposit failed');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      const { data } = await base44.functions.invoke('vaultWithdraw', { amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast.success('Withdrawn from vault');
      setWithdrawAmount('');
      setWithdrawOpen(false);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast.error(error.message || 'Withdrawal failed');
    }
  });

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-400" />
          Vault Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spendable Balance */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-sm">Spendable</span>
            </div>
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-500/10">
                  <ArrowDownToLine className="w-3 h-3 mr-1" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Deposit to Vault</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-slate-400">Amount</Label>
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Available: {spendable.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setDepositAmount(String(Math.floor(spendable * 0.25)))}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600"
                    >
                      25%
                    </Button>
                    <Button
                      onClick={() => setDepositAmount(String(Math.floor(spendable * 0.5)))}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600"
                    >
                      50%
                    </Button>
                    <Button
                      onClick={() => setDepositAmount(String(spendable))}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600"
                    >
                      Max
                    </Button>
                  </div>
                  <Button
                    onClick={() => depositMutation.mutate(Number(depositAmount))}
                    disabled={!depositAmount || Number(depositAmount) <= 0 || depositMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
                  >
                    {depositMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Deposit'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-3xl font-black text-green-400">{spendable.toLocaleString()}</p>
        </div>

        {/* Vault Balance */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 text-sm">Vault (Locked)</span>
            </div>
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-amber-600 text-amber-400 hover:bg-amber-500/10">
                  <ArrowUpFromLine className="w-3 h-3 mr-1" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Withdraw from Vault</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-slate-400">Amount</Label>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Available: {vault.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setWithdrawAmount(String(Math.floor(vault * 0.25)))}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600"
                    >
                      25%
                    </Button>
                    <Button
                      onClick={() => setWithdrawAmount(String(Math.floor(vault * 0.5)))}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600"
                    >
                      50%
                    </Button>
                    <Button
                      onClick={() => setWithdrawAmount(String(vault))}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600"
                    >
                      Max
                    </Button>
                  </div>
                  <Button
                    onClick={() => withdrawMutation.mutate(Number(withdrawAmount))}
                    disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || withdrawMutation.isPending}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold"
                  >
                    {withdrawMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Withdrawal'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-3xl font-black text-purple-400">{vault.toLocaleString()}</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            💡 <strong>Vault Info:</strong> Vault points are used for lottery tickets. Wins are paid back to your vault.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}