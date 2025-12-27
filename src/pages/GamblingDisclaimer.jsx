import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GamblingDisclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('GameGallery')}>
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="bg-slate-900/50 border border-amber-500/30 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-black text-white">Gambling Disclaimer</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
              <p className="text-lg font-semibold text-amber-200 mb-4">
                This platform does not offer gambling as defined under U.S. federal or state law.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>No real money is wagered</li>
                <li>No prizes, cash, or items of value are awarded</li>
                <li>All gameplay uses fictional points for entertainment purposes only</li>
              </ul>
            </div>

            <p className="text-lg">
              Participation does not constitute gambling, wagering, or betting under applicable law.
            </p>

            <p>
              Any resemblance to casino-style games is purely thematic and for entertainment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}