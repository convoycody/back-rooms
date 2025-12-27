import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowToPlay() {
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
            <PlayCircle className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black text-white">How to Play</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <ol className="list-decimal list-inside space-y-4 text-lg">
              <li>Claim your daily points</li>
              <li>Choose a game from the Games Gallery</li>
              <li>Select your bet or game options</li>
              <li>Play and enjoy the experience</li>
              <li>Points are automatically updated after each round</li>
            </ol>

            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 mt-8">
              <p className="text-slate-200">
                If your balance is low, the platform may offer limited top-ups to keep gameplay accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}