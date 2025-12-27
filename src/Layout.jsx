import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, LogOut } from 'lucide-react';
import WalletDropdown from '@/components/WalletDropdown';

export default function Layout({ children, currentPageName }) {
  const [lastChange, setLastChange] = useState(0);
  
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const isAdmin = player?.is_admin || currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation Bar */}
      {currentUser && currentPageName !== 'Admin' && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to={createPageUrl('GameGallery')} className="flex items-center gap-2">
              <span className="text-2xl">🎰</span>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
                OFFICE CASINO
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link 
                to={createPageUrl('GameGallery')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-sm font-medium"
              >
                🎮 Games
              </Link>

              {isAdmin && (
                <Link 
                  to={createPageUrl('Admin')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}

              <WalletDropdown 
                balance={player?.points_balance || 0}
                level={player?.level || 1}
                lastChange={lastChange}
              />
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm">
                  {currentUser.full_name?.[0]?.toUpperCase() || currentUser.email[0].toUpperCase()}
                </div>
                <span className="text-slate-300 text-sm hidden sm:block">
                  {currentUser.full_name || currentUser.email}
                </span>
              </div>

              <button
                onClick={() => base44.auth.logout()}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>
      )}
      
      <main className={currentUser && currentPageName !== 'Admin' ? 'pt-16' : ''}>
        {children}
      </main>

      {/* Footer */}
      {currentUser && currentPageName !== 'Admin' && (
        <footer className="bg-slate-900/50 border-t border-slate-800/50 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <h3 className="text-white font-bold mb-3 text-sm">Legal</h3>
                <div className="space-y-2">
                  <Link to={createPageUrl('TermsOfUse')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Terms of Use
                  </Link>
                  <Link to={createPageUrl('PrivacyPolicy')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </Link>
                  <Link to={createPageUrl('GamblingDisclaimer')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Gambling Disclaimer
                  </Link>
                  <Link to={createPageUrl('Jurisdiction')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Jurisdiction
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3 text-sm">Transparency</h3>
                <div className="space-y-2">
                  <Link to={createPageUrl('Fairness')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Fairness & Integrity
                  </Link>
                  <Link to={createPageUrl('ResponsiblePlay')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Responsible Play
                  </Link>
                  <Link to={createPageUrl('CryptoDisclosure')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Crypto Disclosure
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3 text-sm">Help</h3>
                <div className="space-y-2">
                  <Link to={createPageUrl('HowToPlay')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    How to Play
                  </Link>
                  <Link to={createPageUrl('HowBettingWorks')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    How Betting Works
                  </Link>
                  <Link to={createPageUrl('Support')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Support
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3 text-sm">Platform</h3>
                <div className="space-y-2">
                  <Link to={createPageUrl('GameGallery')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Games
                  </Link>
                  <Link to={createPageUrl('Store')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    Points Store
                  </Link>
                  <Link to={createPageUrl('BTCStore')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                    BTC Store
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <p className="text-center text-slate-500 text-xs">
                Entertainment platform using fictional points only. No real money gambling. No cash value. Void where prohibited.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}