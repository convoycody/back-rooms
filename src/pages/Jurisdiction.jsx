import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Jurisdiction() {
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
            <Globe className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-black text-white">Jurisdiction & Availability</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p className="text-lg">
              This platform is intended for lawful entertainment use only.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <p className="text-xl font-bold text-blue-200 mb-2">
                Access to the platform is void where prohibited by law.
              </p>
            </div>

            <p>
              Users are responsible for ensuring their participation complies with all applicable local, state, and federal regulations.
            </p>

            <p>
              The platform operator makes no representation that the service is appropriate or available in all jurisdictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}