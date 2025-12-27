import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResponsiblePlay() {
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
            <Heart className="w-8 h-8 text-pink-400" />
            <h1 className="text-4xl font-black text-white">Responsible Play</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p className="text-lg">
              While this platform does not involve real money, we encourage users to play responsibly.
            </p>

            <ul className="list-disc list-inside space-y-2">
              <li>Gameplay is intended for entertainment</li>
              <li>Points do not represent real value</li>
              <li>Take breaks when needed</li>
              <li>Use platform limits and controls</li>
            </ul>

            <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-6 mt-6">
              <p className="text-pink-200">
                If you feel gameplay is becoming disruptive, we recommend stepping away.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}