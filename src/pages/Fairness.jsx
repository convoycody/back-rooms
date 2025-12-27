import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Fairness() {
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
            <ShieldCheck className="w-8 h-8 text-green-400" />
            <h1 className="text-4xl font-black text-white">Fairness & Game Integrity</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p className="text-lg">
              Our games use deterministic, auditable systems to ensure consistency and transparency.
            </p>

            <ul className="list-disc list-inside space-y-2">
              <li>Outcomes are generated using server-controlled randomness combined with user input</li>
              <li>No individual user is targeted or adjusted dynamically</li>
              <li>Game rules and payout structures are defined in advance</li>
            </ul>

            <p>
              Administrative controls affect future gameplay configurations only and do not manipulate individual outcomes.
            </p>

            <p>
              All point changes are logged internally to maintain system integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}