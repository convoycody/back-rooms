import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Vault, ArrowDown, ArrowUp, Loader2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function VaultBalanceCard({ player, config, onUpdate }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await base44.functions.invoke('depositToVault', { amount });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Deposited ${data.amount.toLocaleString()} points to vault`);
      queryClient.invalidateQueries({ queryKey: ['player'] });
      setDepositAmount('');
      setDepositOpen(false);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to deposit');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await base44.functions.invoke('withdrawFromVault', { amount });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Withdrew ${data.amount.toLocaleString()} points from vault`);
      queryClient.invalidateQueries({ queryKey: ['player'] });
      setWithdrawAmount('');
      setWithdrawOpen(false);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData?.cooldown_remaining_seconds) {
        const minutes = Math.ceil(errorData.cooldown_remaining_seconds / 60);
        toast.error(`Cooldown active. Wait ${minutes} more minutes.`);
      } else {
        toast.error(errorData?.error || 'Failed to withdraw');
      }
    },
  });

  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const vaultBalance = player?.vault_points || 0;
  const spendableBalance = player?.points_balance || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-700/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Vault className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Vault Balance</h3>
          </div>

          <div className="mb-6">
            <p className="text-4xl font-black text-purple-300">
              {vaultBalance.toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm mt-1">points locked in vault</p>
            {config?.interest_rate_percentage > 0 && (
              <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                📈 Earning {config.interest_rate_percentage}% APY
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  disabled={!config?.vault_enabled || spendableBalance <= 0}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <ArrowDown className="w-5 h-5 text-green-400" />
                    Deposit to Vault
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Vault points are locked for ticket purchases
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Available Balance</Label>
                    <p className="text-2xl font-bold text-white">
                      {spendableBalance.toLocaleString()} pts
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Amount to Deposit</Label>
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-slate-800 border-slate-700 text-white"
                      min={config?.min_deposit || 100}
                      max={config?.max_deposit || 100000}
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      Min: {config?.min_deposit?.toLocaleString() || 100} • 
                      Max: {config?.max_deposit?.toLocaleString() || 100000}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount('1000')}
                      className="flex-1"
                    >
                      1,000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount('5000')}
                      className="flex-1"
                    >
                      5,000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(spendableBalance.toString())}
                      className="flex-1"
                    >
                      Max
                    </Button>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={depositMutation.isPending || !depositAmount}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    {depositMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Deposit to Vault'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-purple-600 text-purple-300 hover:bg-purple-500/10 font-bold"
                  disabled={!config?.vault_enabled || vaultBalance <= 0}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <ArrowUp className="w-5 h-5 text-purple-400" />
                    Withdraw from Vault
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-amber-300 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {config?.withdraw_cooldown_minutes || 60} min cooldown • 
                      Max {config?.max_withdrawals_per_day || 5}/day
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Vault Balance</Label>
                    <p className="text-2xl font-bold text-purple-300">
                      {vaultBalance.toLocaleString()} pts
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Amount to Withdraw</Label>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-slate-800 border-slate-700 text-white"
                      min={config?.min_withdraw || 100}
                      max={vaultBalance}
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      Min: {config?.min_withdraw?.toLocaleString() || 100}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount('1000')}
                      className="flex-1"
                    >
                      1,000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount('5000')}
                      className="flex-1"
                    >
                      5,000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(vaultBalance.toString())}
                      className="flex-1"
                    >
                      Max
                    </Button>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending || !withdrawAmount}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    {withdrawMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Withdraw from Vault'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {player?.vault_withdrawals_today > 0 && (
            <p className="text-slate-500 text-xs mt-3 text-center">
              Withdrawals today: {player.vault_withdrawals_today}/{config?.max_withdrawals_per_day || 5}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}