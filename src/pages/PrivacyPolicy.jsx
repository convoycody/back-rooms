import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-black text-white mb-8">Privacy Policy</h1>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <p>
              This platform is designed for private entertainment use. We collect only the minimum information required to operate the service.
            </p>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Information we collect</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Account identifiers (username or display name)</li>
                <li>Gameplay activity (points, games played, wagers)</li>
                <li>Technical data required to operate the platform (IP address, device type, timestamps)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">What we do NOT collect</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>No government-issued IDs</li>
                <li>No financial account details</li>
                <li>No personal addresses</li>
                <li>No payment card data (if crypto is used, it is processed by third-party providers)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">How information is used</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To operate gameplay features</li>
                <li>To maintain balances and fairness</li>
                <li>To prevent abuse or misuse of the platform</li>
                <li>To improve platform performance</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Data sharing</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>We do not sell or rent user data</li>
                <li>We do not share data with advertisers</li>
                <li>Data may be shared only when legally required</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Data retention</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Gameplay records may be retained for auditing and integrity purposes</li>
                <li>Users may request deletion of their account where applicable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}