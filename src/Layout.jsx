import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, LogOut, MessageSquare, Menu, X, Home, Gamepad2, Wallet, Gift, Crown, DollarSign } from 'lucide-react';
import WalletDropdown from '@/components/WalletDropdown';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [lastChange] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo - Always clickable to home */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl">🚪</span>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 text-sm sm:text-base">
                THE BACKROOMS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 lg:gap-4">
              <Link 
                to={createPageUrl('Home')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-xs sm:text-sm font-medium"
              >
                🏠 <span className="hidden lg:inline">Home</span>
              </Link>

              <Link 
                to={createPageUrl('GameGallery')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-xs sm:text-sm font-medium"
              >
                🎮 <span className="hidden lg:inline">Games</span>
              </Link>

              <Link 
                to={createPageUrl('Wallet')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-xs sm:text-sm font-medium"
              >
                💰 <span className="hidden lg:inline">Wallet</span>
              </Link>

              <Link 
                to={createPageUrl('Referrals')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-xs sm:text-sm font-medium"
              >
                🎁 <span className="hidden lg:inline">Referrals</span>
              </Link>

              <Link 
                to={createPageUrl('VIPStatus')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors text-xs sm:text-sm font-medium"
              >
                👑 <span className="hidden lg:inline">VIP</span>
              </Link>

              {isAdmin && (
                <Link 
                  to={createPageUrl('Admin')}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs sm:text-sm font-medium"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}

              <button
                onClick={() => setChatOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <WalletDropdown 
                balance={player?.points_balance || 0}
                vipTier={player?.vip_tier || 0}
                lastChange={lastChange}
              />
              
              <Link to={createPageUrl('UserProfile')} className="hidden md:flex items-center gap-2 lg:gap-3 hover:opacity-80 transition-opacity">
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs sm:text-sm overflow-hidden">
                    {player?.avatar_url ? (
                      <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser.full_name?.[0]?.toUpperCase() || currentUser.email[0].toUpperCase()}</span>
                    )}
                  </div>
                  {player?.vip_tier > 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border border-slate-900 flex items-center justify-center">
                      <span className="text-[8px]">👑</span>
                    </div>
                  )}
                </div>
                <span className="text-slate-300 text-xs sm:text-sm hidden lg:block truncate max-w-[120px]">
                  {player?.display_name || currentUser.full_name || currentUser.email}
                </span>
              </Link>

              <button
                onClick={() => base44.auth.logout()}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Mobile Right Actions */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setChatOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <WalletDropdown 
                balance={player?.points_balance || 0}
                vipTier={player?.vip_tier || 0}
                lastChange={lastChange}
              />
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 sm:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 sm:hidden overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-black text-lg">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Profile */}
                <Link 
                  to={createPageUrl('UserProfile')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 mb-6"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      {player?.avatar_url ? (
                        <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{currentUser?.full_name?.[0]?.toUpperCase() || currentUser?.email[0].toUpperCase()}</span>
                      )}
                    </div>
                    {player?.vip_tier > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center">
                        <span className="text-xs">👑</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{player?.display_name || currentUser?.full_name || currentUser?.email}</p>
                    <p className="text-slate-400 text-sm">View Profile</p>
                  </div>
                </Link>

                {/* Navigation Links */}
                <div className="space-y-2">
                  <Link
                    to={createPageUrl('Home')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </Link>

                  <Link
                    to={createPageUrl('GameGallery')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <Gamepad2 className="w-5 h-5" />
                    <span className="font-medium">Games</span>
                  </Link>

                  <Link
                    to={createPageUrl('Wallet')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="font-medium">Wallet</span>
                  </Link>

                  <Link
                    to={createPageUrl('Referrals')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <Gift className="w-5 h-5" />
                    <span className="font-medium">Referrals</span>
                  </Link>

                  <Link
                    to={createPageUrl('VIPStatus')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors"
                  >
                    <Crown className="w-5 h-5" />
                    <span className="font-medium">VIP Status</span>
                  </Link>

                  <Link
                    to={createPageUrl('Store')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Get Points</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to={createPageUrl('Admin')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    base44.auth.logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 mt-6 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <main className={currentUser && currentPageName !== 'Admin' ? 'pt-16' : ''}>
        {children}
      </main>

      {/* Chat Sidebar */}
      {currentUser && <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />}

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
                  <Link to={createPageUrl('Home')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                      Home
                    </Link>
                    <Link to={createPageUrl('GameGallery')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                      Games
                    </Link>
                    <Link to={createPageUrl('Wallet')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                      Wallet
                    </Link>
                    <Link to={createPageUrl('Store')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                      Points Store
                    </Link>
                    <Link to={createPageUrl('BTCStore')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                      BTC Store
                    </Link>
                    <Link to={createPageUrl('Announcements')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                        Announcements
                      </Link>
                      <Link to={createPageUrl('LargeWinnings')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                        Large Winnings
                      </Link>
                      <Link to={createPageUrl('Leaderboards')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                        Leaderboards
                      </Link>
                      <Link to={createPageUrl('Settings')} className="block text-slate-400 hover:text-white text-sm transition-colors">
                        Settings
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
