import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Mail, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Support() {
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
            <HelpCircle className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-black text-white">Support</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 mb-8">
            <p className="text-lg">
              For questions or concerns:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Gameplay issues</li>
              <li>Account questions</li>
              <li>Policy clarifications</li>
            </ul>
            <p>
              Contact the platform administrator through the provided support channel.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  Help Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl('HowToPlay')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                    How to Play
                  </Button>
                </Link>
                <Link to={createPageUrl('HowBettingWorks')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                    How Betting Works
                  </Button>
                </Link>
                <Link to={createPageUrl('Fairness')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                    Fairness & Integrity
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  Legal & Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl('TermsOfUse')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                    Terms of Use
                  </Button>
                </Link>
                <Link to={createPageUrl('PrivacyPolicy')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                    Privacy Policy
                  </Button>
                </Link>
                <Link to={createPageUrl('GamblingDisclaimer')}>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
                    Gambling Disclaimer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}