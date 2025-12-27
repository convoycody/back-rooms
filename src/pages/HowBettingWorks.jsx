import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowBettingWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('GameGallery')}>
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Coins className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-black text-white">How Bets Work</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p className="text-lg">
              All bets on this platform use fictional points.
            </p>

            <ul className="list-disc list-inside space-y-2">
              <li>Points are deducted when gameplay begins</li>
              <li>Outcomes may award additional points</li>
              <li>Points cannot be exchanged for real-world value</li>
            </ul>

            <p>
              Bet limits may vary by game and are set to ensure balanced gameplay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}