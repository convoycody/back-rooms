import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function GameShell({ 
  game, 
  balance, 
  children, 
  onSessionStart, 
  onSessionEnd
}) {
  const [stats, setStats] = useState({
    totalBet: 0,
    totalWon: 0,
    netResult: 0,
    roundsPlayed: 0,
    lastWin: 0
  });

  useEffect(() => {
    if (onSessionStart) {
      onSessionStart();
    }
    return () => {
      if (onSessionEnd) {
        onSessionEnd(stats);
      }
    };
  }, []);

  const updateStats = (roundData) => {
    setStats(prev => ({
      totalBet: prev.totalBet + (roundData.bet || 0),
      totalWon: prev.totalWon + (roundData.payout || 0),
      netResult: prev.netResult + (roundData.net || 0),
      roundsPlayed: prev.roundsPlayed + 1,
      lastWin: roundData.payout || prev.lastWin
    }));
  };

  // Clone children and inject updateStats callback
  const childrenWithStats = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { onRoundComplete: updateStats });
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800/50 sticky top-0 z-40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link to={createPageUrl('Home')}>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Games
                  </Button>
                </Link>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    {game?.icon} {game?.name || 'Game'}
                  </h1>
                  {game?.tagline && (
                    <p className="text-slate-400 text-xs">{game.tagline}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-xs">Balance</p>
                  <p className="text-white font-bold">{balance?.toLocaleString() || 0} pts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Stats Bar */}
        <div className="bg-slate-900/30 border-b border-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400">Rounds: </span>
                  <span className="text-white font-semibold">{stats.roundsPlayed}</span>
                </div>
                <div>
                  <span className="text-slate-400">Wagered: </span>
                  <span className="text-white font-semibold">{stats.totalBet.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Won: </span>
                  <span className="text-green-400 font-semibold">{stats.totalWon.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Net: </span>
                  <span className={`font-semibold ${stats.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.netResult >= 0 ? '+' : ''}{stats.netResult.toLocaleString()}
                  </span>
                </div>
              </div>

              {stats.lastWin > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Last Win: +{stats.lastWin.toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {childrenWithStats}
        </div>
      </div>
    </div>
  );
}
