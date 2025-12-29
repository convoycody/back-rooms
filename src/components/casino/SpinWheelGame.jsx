import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { soundManager } from './SoundManager';

const riskConfigs = {
  low: {
    label: 'Low Risk • Steady spins',
    minMultiplier: 0.5,
    multipliers: [0.5, 1, 1, 1.5, 2, 3],
    weights: [2, 3, 3, 2, 2, 1],
    accent: 'from-emerald-500/40 to-emerald-600/40'
  },
  medium: {
    label: 'Medium Risk • Balanced',
    minMultiplier: 0,
    multipliers: [0, 0.5, 1, 2, 4, 8],
    weights: [2, 2, 3, 3, 2, 1],
    accent: 'from-amber-500/40 to-orange-500/40'
  },
  high: {
    label: 'High Risk • High stakes',
    minMultiplier: 0,
    multipliers: [0, 0, 1, 3, 8, 20],
    weights: [3, 3, 2, 2, 1, 1],
    accent: 'from-rose-500/40 to-purple-500/40'
  }
};

const MIN_BET = 10000;

export default function SpinWheelGame({
  balance,
  onGameEnd,
  onRoundComplete,
  houseConfig
}) {
  const [bet, setBet] = useState(MIN_BET);
  const [risk, setRisk] = useState('high');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const config = riskConfigs[risk];

  useEffect(() => {
    soundManager.ensureTone('wheel-start', 1180, 160, 0.4);
    soundManager.ensureTone('wheel-win', 1420, 240, 0.5);
    soundManager.ensureTone('wheel-miss', 360, 260, 0.4);
  }, []);

  const segments = useMemo(() => {
    const colors = ['from-purple-600/70', 'from-amber-500/70', 'from-emerald-500/70', 'from-blue-500/70', 'from-pink-500/70', 'from-cyan-500/70'];
    return config.multipliers.map((mult, idx) => ({
      multiplier: mult,
      label: `${mult}x`,
      color: colors[idx % colors.length]
    }));
  }, [config.multipliers]);

  const spin = () => {
    if (spinning) return;
    if (bet < MIN_BET) {
      toast.error(`Minimum bet is ${MIN_BET.toLocaleString()} pts`);
      return;
    }
    if (bet > balance) {
      toast.error('Insufficient balance for this high-limit spin');
      return;
    }
    setSpinning(true);
    setResult(null);
    soundManager.play('wheel-start', 0.8);

    const totalWeight = config.weights.reduce((a, b) => a + b, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    let chosenIndex = 0;
    config.weights.forEach((w, idx) => {
      cumulative += w;
      if (roll <= cumulative && chosenIndex === 0) {
        chosenIndex = idx;
      }
    });

    setTimeout(() => {
      const chosen = segments[chosenIndex];
      const payout = Math.round(bet * chosen.multiplier);
      const net = payout - bet;
      const roundResult = {
        bet,
        total_bet: bet,
        payout,
        total_win: payout,
        net_result: net,
        multiplier: chosen.multiplier,
        outcome: payout > 0 ? 'win' : 'loss',
        risk
      };
      setResult(roundResult);
      if (onRoundComplete) onRoundComplete({ bet, payout, net });
      if (onGameEnd) onGameEnd(roundResult);
      if (payout > 0) {
        soundManager.play('wheel-win', 1);
        toast.success(`Hit ${chosen.multiplier}x for +${payout.toLocaleString()} pts`);
      } else {
        soundManager.play('wheel-miss', 0.9);
        toast.error('Missed the wheel this time');
      }
      setSpinning(false);
    }, 1000);
  };

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-slate-800/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">High Limit</p>
              <h2 className="text-3xl font-black text-white flex items-center gap-2">
                🎡 Spin the Wheel
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Min {MIN_BET.toLocaleString()} pts</Badge>
              </h2>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-200">
              {houseConfig?.wheel_enabled === false ? 'Disabled' : 'Live'}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-3">
              <label className="text-slate-400 text-sm">Bet Amount</label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[bet]}
                  onValueChange={([v]) => setBet(Math.max(MIN_BET, Math.min(v, balance)))}
                  min={MIN_BET}
                  max={Math.max(MIN_BET, balance)}
                  step={1000}
                />
                <input
                  type="number"
                  value={bet}
                  onChange={(e) => setBet(parseInt(e.target.value, 10) || MIN_BET)}
                  className="w-28 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-right"
                  min={MIN_BET}
                />
              </div>
              <p className="text-slate-500 text-xs">Balance: {balance?.toLocaleString() || 0} pts</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-slate-400 text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Risk Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(riskConfigs).map((key) => (
                  <Button
                    key={key}
                    variant={risk === key ? 'default' : 'outline'}
                    onClick={() => setRisk(key)}
                    className={risk === key ? 'bg-purple-600 text-white' : 'border-slate-700 text-slate-300'}
                  >
                    {key[0].toUpperCase() + key.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="text-slate-400 text-xs">{config.label}</p>
            </div>
          </div>

          <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${config.accent} opacity-20`} />
            <div className="relative z-10 grid md:grid-cols-3 gap-4">
              {segments.map((segment, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 flex flex-col gap-2`}
                >
                  <span className={`inline-flex w-fit px-2 py-1 rounded-md text-xs bg-gradient-to-r ${segment.color} text-white`}>
                    Wedge {idx + 1}
                  </span>
                  <p className="text-2xl font-black text-white">{segment.multiplier}x</p>
                  <p className="text-slate-400 text-xs">Weight: {config.weights[idx]}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={spin}
                disabled={spinning || houseConfig?.wheel_enabled === false}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3"
              >
                {spinning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spin Now'}
              </Button>
              <p className="text-slate-400 text-xs">High-limit table • Minimum {MIN_BET.toLocaleString()} pts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-slate-900/70 to-slate-950/70 border-slate-800/70">
          <CardContent className="p-5 space-y-2">
            <p className="text-slate-400 text-sm">House Edge & Volatility</p>
            <p className="text-white font-bold text-lg">Risk tuned for social casino high rollers</p>
            <p className="text-slate-400 text-sm">
              Choose your risk to tilt the wheel toward safer or explosive wedges. Multipliers and weights update instantly.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">6 Segments</Badge>
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">High Limit</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">Risk Control</Badge>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/70">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-slate-400 text-xs">Last Spin</p>
                    <p className="text-3xl font-black text-white">{result.multiplier}x</p>
                    <p className="text-slate-400 text-sm">Risk: {risk}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${result.net_result >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.net_result >= 0 ? '+' : ''}{result.net_result.toLocaleString()} pts
                    </p>
                    <p className="text-slate-400 text-xs">Bet {result.bet.toLocaleString()} • Payout {result.payout.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="bg-slate-900/60 border-slate-800/60">
          <CardContent className="p-5 text-sm space-y-2 text-slate-300">
            <p className="font-bold text-white">Wheel Disclosure</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Minimum bet {MIN_BET.toLocaleString()} pts. High limit table.</li>
              <li>Weights shift with risk level to balance volatility.</li>
              <li>All spins are client-seeded social casino spins; no cash wagering.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
