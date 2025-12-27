import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfUse() {
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
          <h1 className="text-4xl font-black text-white mb-8">Terms of Use</h1>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p className="text-lg">
              By accessing or using this platform, you agree to the following terms.
            </p>

            <div>
              <p>
                This platform provides digital entertainment using fictional points only. These points:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Have no monetary value</li>
                <li>Cannot be redeemed for cash, goods, or services</li>
                <li>Exist solely within the platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">We reserve the right to:</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Modify or disable features at any time</li>
                <li>Reset point balances</li>
                <li>Suspend or terminate accounts</li>
                <li>Adjust game rules, odds, or mechanics</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Users agree:</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Not to exploit bugs or loopholes</li>
                <li>Not to automate gameplay</li>
                <li>Not to misrepresent identity or activity</li>
              </ul>
            </div>

            <p className="text-amber-300 font-semibold">
              Violation of these terms may result in account suspension or permanent removal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}