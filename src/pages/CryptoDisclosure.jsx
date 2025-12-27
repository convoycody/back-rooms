import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CryptoDisclosure() {
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
            <Bitcoin className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-black text-white">Cryptocurrency Payments</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p className="text-lg">
              Cryptocurrency payments may be used to acquire fictional platform points.
            </p>

            <ul className="list-disc list-inside space-y-2">
              <li>Cryptocurrency payments are irreversible</li>
              <li>Points received have no monetary value</li>
              <li>Payments do not represent deposits or investments</li>
            </ul>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">The platform is not responsible for:</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Network fees</li>
                <li>Payment delays</li>
                <li>Incorrect wallet addresses</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mt-6">
              <p className="text-amber-200 font-semibold">
                Points are credited only after payment confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}