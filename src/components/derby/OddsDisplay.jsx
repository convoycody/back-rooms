import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function OddsDisplay({ horses, entries }) {
  const calculateOdds = (horse) => {
    if (!horse) return null;
    
    if (horse.races_entered < 3) {
      return { display: 'Unrated', isNew: true, decimal: null };
    }

    const totalSkill = horses.reduce((sum, h) => sum + (h.skill_rating || 1000), 0);
    const baseProb = horse.skill_rating / totalSkill;

    const winRate = horse.races_entered > 0 ? horse.wins / horse.races_entered : 0;
    const formAdjustment = winRate * 0.2;

    const placeRate = horse.races_entered > 0 ? (horse.places + horse.shows) / horse.races_entered : 0;
    const consistencyBonus = placeRate * 0.1;

    const adjustedProb = Math.min(0.95, Math.max(0.05, baseProb + formAdjustment + consistencyBonus));
    const decimalOdds = 1 / adjustedProb;
    const fractional = decimalOdds - 1;
    
    return {
      display: `${fractional.toFixed(1)}:1`,
      decimal: decimalOdds.toFixed(2),
      isNew: false,
      probability: (adjustedProb * 100).toFixed(1),
    };
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const horseA = horses.find(h => h.id === a.horse_id);
    const horseB = horses.find(h => h.id === b.horse_id);
    const oddsA = calculateOdds(horseA);
    const oddsB = calculateOdds(horseB);
    
    if (oddsA.isNew) return 1;
    if (oddsB.isNew) return -1;
    
    return parseFloat(oddsB.probability) - parseFloat(oddsA.probability);
  });

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-white font-bold">Projected Odds</h3>
          <p className="text-slate-400 text-xs mt-1">Final payout depends on total pool at race close</p>
        </div>
        
        <div className="space-y-2">
          {sortedEntries.map((entry, idx) => {
            const horse = horses.find(h => h.id === entry.horse_id);
            if (!horse) return null;
            
            const odds = calculateOdds(horse);
            const isFavorite = idx === 0 && !odds.isNew;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isFavorite ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{horse.avatar_emoji}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{horse.horse_name}</p>
                    {isFavorite && (
                      <p className="text-amber-400 text-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Favorite
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {odds.isNew ? (
                    <div className="text-slate-500 text-sm">Unrated</div>
                  ) : (
                    <>
                      <p className="text-amber-400 font-bold">{odds.display}</p>
                      <p className="text-slate-500 text-xs">{odds.probability}%</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">
            Odds based on skill rating, form, and recent performance. New horses (under 3 races) are unrated.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}