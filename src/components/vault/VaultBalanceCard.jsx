import React, { useEffect, useMemo, useState } from 'react';
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
  const [recentBalances, setRecentBalances] = useState(null);
  const queryClient = useQueryClient();

  const vaultBalance = recentBalances?.vault ?? player?.vault_points ?? 0;
  const spendableBalance = recentBalances?.spendable ?? player?.points_balance ?? 0;

  const depositMin = config?.min_deposit ?? 100;
  const depositMax = Math.max(0, Math.min(spendableBalance, config?.max_deposit ?? spendableBalance));
  const withdrawMin = config?.min_withdraw ?? 100;
  const withdrawMax = Math.max(0, Math.min(vaultBalance, config?.max_withdraw ?? vaultBalance));

  const depositQuickAmounts = useMemo(() => {
    const starter = depositMin > 0 ? depositMin : 100;
    const mid = Math.min(depositMax, starter * 5);
    const upper = Math.min(depositMax, Math.max(starter, Math.round(depositMax / 2)) || depositMax);
    return [starter, mid, upper].filter((amt, idx, arr) => amt > 0 && amt <= depositMax && arr.indexOf(amt) === idx);
  }, [depositMax, depositMin]);

  const withdrawQuickAmounts = useMemo(() => {
    const starter = withdrawMin > 0 ? withdrawMin : 100;
    const mid = Math.min(withdrawMax, starter * 5);
    const upper = Math.min(withdrawMax, Math.max(starter, Math.round(withdrawMax / 2)) || withdrawMax);
    return [starter, mid, upper].filter((amt, idx, arr) => amt > 0 && amt <= withdrawMax && arr.indexOf(amt) === idx);
  }, [withdrawMax, withdrawMin]);

  useEffect(() => {
    setRecentBalances(null);
  }, [player?.vault_points, player?.points_balance]);

  useEffect(() => {
    if (depositOpen && !depositAmount && depositMax > 0) {
      setDepositAmount((depositQuickAmounts[0] ?? depositMax).toString());
    }
    if (!depositOpen) setDepositAmount('');
  }, [depositOpen, depositMax, depositQuickAmounts, depositAmount]);

  useEffect(() => {
    if (withdrawOpen && !withdrawAmount && withdrawMax > 0) {
      setWithdrawAmount((withdrawQuickAmounts[0] ?? withdrawMax).toString());
    }
    if (!withdrawOpen) setWithdrawAmount('');
  }, [withdrawOpen, withdrawMax, withdrawQuickAmounts, withdrawAmount]);

  const getDepositValidation = () => {
    const amount = parseInt(depositAmount, 10);
    if (!depositAmount) return `Min: ${depositMin.toLocaleString()} • Max: ${depositMax.toLocaleString()}`;
    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
    if (amount < depositMin) return `Minimum deposit is ${depositMin.toLocaleString()} pts`;
    if (amount > depositMax) return `Maximum deposit is ${depositMax.toLocaleString()} pts`;
    if (amount > spendableBalance) return 'Exceeds spendable balance';
    return `Will leave ${(spendableBalance - amount).toLocaleString()} pts spendable`;
  };

  const getWithdrawValidation = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!withdrawAmount) return `Min: ${withdrawMin.toLocaleString()} • Cooldown: ${config?.withdraw_cooldown_minutes || 60}m`;
    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
    if (amount < withdrawMin) return `Minimum withdrawal is ${withdrawMin.toLocaleString()} pts`;
    if (amount > withdrawMax) return `Maximum available is ${withdrawMax.toLocaleString()} pts`;
    return `Next withdrawal unlocks after ${config?.withdraw_cooldown_minutes || 60} minutes`;
  };

  const depositValid = useMemo(() => {
    const amount = parseInt(depositAmount, 10);
    return !!amount && amount >= depositMin && amount <= depositMax && amount <= spendableBalance;
  }, [depositAmount, depositMax, depositMin, spendableBalance]);

  const withdrawValid = useMemo(() => {
    const amount = parseInt(withdrawAmount, 10);
    return !!amount && amount >= withdrawMin && amount <= withdrawMax;
  }, [withdrawAmount, withdrawMax, withdrawMin]);

  const depositMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await base44.functions.invoke('depositToVault', { amount });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Deposited ${data.amount.toLocaleString()} pts • Vault: ${data.vault_balance.toLocaleString()} • Spendable: ${data.spendable_balance.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['ledger', player?.id] });
      queryClient.invalidateQueries({ queryKey: ['vaultTransactions', player?.id] });
      setRecentBalances({ vault: data.vault_balance, spendable: data.spendable_balance });
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
      const cooldownLabel = `${config?.withdraw_cooldown_minutes || 60}m cooldown`;
      toast.success(`Withdrew ${data.amount.toLocaleString()} pts • Vault: ${data.vault_balance.toLocaleString()} • Spendable: ${data.spendable_balance.toLocaleString()} • ${data.withdrawals_remaining_today ?? '∞'} withdrawals left today • ${cooldownLabel}`);
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['ledger', player?.id] });
      queryClient.invalidateQueries({ queryKey: ['vaultTransactions', player?.id] });
      setRecentBalances({ vault: data.vault_balance, spendable: data.spendable_balance });
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
    if (!depositValid) {
      toast.error(getDepositValidation());
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!withdrawValid) {
      toast.error(getWithdrawValidation());
      return;
    }
    withdrawMutation.mutate(amount);
  };

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
            <motion.p 
              key={vaultBalance}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-4xl font-black text-purple-300"
            >
              {vaultBalance.toLocaleString()}
            </motion.p>
            <motion.p 
              key={spendableBalance}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-slate-400 text-sm mt-1"
            >
              points locked in vault • Spendable: {spendableBalance.toLocaleString()}
            </motion.p>
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
                      min={depositMin}
                      max={depositMax}
                    />
                    <p className={`text-xs mt-1 ${depositValid ? 'text-slate-400' : 'text-red-400'}`}>
                      {getDepositValidation()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {depositQuickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount(amt.toString())}
                        className="flex-1"
                      >
                        {amt.toLocaleString()}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(depositMax.toString())}
                      className="flex-1"
                      disabled={depositMax <= 0}
                    >
                      Max
                    </Button>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={depositMutation.isPending || !depositValid}
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
                      min={withdrawMin}
                      max={withdrawMax}
                    />
                    <p className={`text-xs mt-1 ${withdrawValid ? 'text-slate-400' : 'text-red-400'}`}>
                      {getWithdrawValidation()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {withdrawQuickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(amt.toString())}
                        className="flex-1"
                      >
                        {amt.toLocaleString()}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(withdrawMax.toString())}
                      className="flex-1"
                      disabled={withdrawMax <= 0}
                    >
                      Max
                    </Button>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending || !withdrawValid}
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
