import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { soundManager } from './SoundManager';

const MIN_BET = 1000;

const flipAnim = {
  initial: { rotateY: 0 },
  animate: { rotateY: 360 },
  transition: { duration: 0.8, ease: 'easeInOut' }
};

export default function CoinFlipGame({ balance, onGameEnd, onRoundComplete }) {
  const [bet, setBet] = useState(MIN_BET);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [doubleOrNothing, setDoubleOrNothing] = useState(null);

  useEffect(() => {
    soundManager.ensureTone('cf-flip', 900, 160, 0.35);
    soundManager.ensureTone('cf-win', 1400, 220, 0.45);
    soundManager.ensureTone('cf-lose', 320, 260, 0.35);
    soundManager.ensureTone('cf-double', 1180, 260, 0.5);
  }, []);

  const outcomeCard = useMemo(() => {
    if (!result) return null;
    const won = result.outcome === 'win';
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <Card className={`border ${won ? 'border-emerald-400 bg-emerald-500/10' : 'border-rose-400 bg-rose-500/10'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Result</p>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                {result.flip.toUpperCase()} {won ? '✓' : '✕'}
              </p>
              {doubleOrNothing && (
                <p className="text-amber-300 text-xs mt-1">Double or Nothing active</p>
              )}
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${won ? 'text-emerald-400' : 'text-rose-400'}`}>
                {won ? '+' : ''}{result.net_result.toLocaleString()} pts
              </p>
              <p className="text-slate-400 text-xs">Bet {result.bet.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }, [result, doubleOrNothing]);

  const doFlip = ({ isDoubleOrNothing = false } = {}) => {
    if (flipping) return;
    const stake = bet;

    if (!isDoubleOrNothing) {
      if (bet < MIN_BET) {
        toast.error(`Minimum bet is ${MIN_BET.toLocaleString()} pts`);
        return;
      }
      if (bet > balance) {
        toast.error('Insufficient balance for this flip');
        return;
      }
    }

    setFlipping(true);
    setResult(null);
    soundManager.play('cf-flip', 0.9);

    setTimeout(() => {
      const flip = Math.random() > 0.5 ? 'heads' : 'tails';
      const win = flip === choice;
      const payout = win ? stake * (isDoubleOrNothing ? 2 : 2) : 0;
      const net = isDoubleOrNothing ? (win ? stake * 2 : 0) : payout - stake;

      const roundResult = {
        bet: stake,
        total_bet: stake,
        payout,
        total_win: payout,
        net_result: net,
        flip,
        outcome: win ? 'win' : 'lose',
        double_attempt: isDoubleOrNothing
      };

      setResult(roundResult);
      setFlipping(false);

      if (win) {
        soundManager.play(isDoubleOrNothing ? 'cf-double' : 'cf-win', 1);
      } else {
        soundManager.play('cf-lose', 0.9);
      }

      if (!isDoubleOrNothing && !win) {
        setDoubleOrNothing({ available: true, lastChoice: choice });
      } else {
        setDoubleOrNothing(null);
      }

      if (onRoundComplete) onRoundComplete({ bet: stake, payout, net });
      if (onGameEnd) onGameEnd(roundResult);
    }, 700);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_0.8fr] gap-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-slate-800/60">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Lightning Coin Flip</p>
              <h2 className="text-3xl font-black text-white flex items-center gap-2">
                🪙 Heads or Tails
                <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">Double or Nothing</Badge>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Bet, flip, and recover with a free double-down after losses.</p>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-200">Min {MIN_BET.toLocaleString()} pts</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-slate-400 text-sm">Bet Amount</label>
              <Slider
                value={[bet]}
                onValueChange={([v]) => setBet(Math.max(MIN_BET, Math.min(v, balance)))}
                min={MIN_BET}
                max={Math.max(MIN_BET, balance)}
                step={500}
              />
              <input
                type="number"
                value={bet}
                min={MIN_BET}
                onChange={(e) => setBet(Math.max(MIN_BET, parseInt(e.target.value, 10) || MIN_BET))}
                className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-right"
              />
              <p className="text-slate-500 text-xs">Balance: {balance?.toLocaleString() || 0} pts</p>
            </div>

            <div className="space-y-3">
              <label className="text-slate-400 text-sm">Your Pick</label>
              <div className="grid grid-cols-2 gap-2">
                {['heads', 'tails'].map(opt => (
                  <Button
                    key={opt}
                    variant={choice === opt ? 'default' : 'outline'}
                    onClick={() => setChoice(opt)}
                    className={choice === opt ? 'bg-amber-500 text-black font-bold' : 'border-slate-700 text-slate-300'}
                  >
                    {opt === 'heads' ? '🪙 Heads' : '🌙 Tails'}
                  </Button>
                ))}
              </div>
              <p className="text-slate-400 text-xs">50/50 chance • automatic free double after a loss.</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-20 h-20 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={result?.flip || choice}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 shadow-2xl shadow-amber-500/30 border-4 border-amber-200 flex items-center justify-center text-2xl font-black text-slate-900"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: flipping ? 360 : 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  >
                    {result?.flip === 'tails' ? '🌙' : '🪙'}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="space-y-1">
                <p className="text-slate-300 text-sm">Flip the coin</p>
                <p className="text-slate-500 text-xs">Outcome animates with sound cues.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Button
                onClick={() => doFlip()}
                disabled={flipping}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3"
              >
                {flipping ? <Loader2 className="w-4 h-4 animate-spin" /> : `Flip (${bet.toLocaleString()} pts)`}
              </Button>
              {doubleOrNothing?.available && (
                <Button
                  variant="outline"
                  onClick={() => doFlip({ isDoubleOrNothing: true })}
                  disabled={flipping}
                  className="border-purple-500 text-purple-300 hover:bg-purple-500/10"
                >
                  Free Double or Nothing
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {outcomeCard}
        {!outcomeCard && (
          <Card className="bg-slate-900/60 border-slate-800/60">
            <CardContent className="p-4 text-slate-300 text-sm space-y-1">
              <p className="font-bold text-white">How it works</p>
              <p>Pick heads or tails, bet at least {MIN_BET.toLocaleString()} pts.</p>
              <p>If you lose, trigger a free double-or-nothing flip—win it to get 2× your bet back on the house.</p>
              <p>All spins include sound cues through the platform sound engine.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
