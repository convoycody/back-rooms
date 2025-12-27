import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Grid3x3, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GameCard from './GameCard';
import BalanceDisplay from '@/components/casino/BalanceDisplay';

export default function GameShell({ 
  currentGame, 
  allGames = [], 
  onGameChange,
  balance,
  lastChange,
  level,
  xp,
  children 
}) {
  const [gameMenuOpen, setGameMenuOpen] = useState(false);

  const handleGameSelect = (game) => {
    onGameChange(game);
    setGameMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Game Info & Navigation */}
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('GameGallery')}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Gallery
                </Button>
              </Link>

              {currentGame && (
                <>
                  <div className="h-6 w-px bg-slate-700" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentGame.icon}</span>
                    <div>
                      <h2 className="font-bold text-white">{currentGame.name}</h2>
                      <p className="text-slate-400 text-xs">{currentGame.tagline}</p>
                    </div>
                  </div>
                </>
              )}

              <Sheet open={gameMenuOpen} onOpenChange={setGameMenuOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Switch Game
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-slate-900 border-slate-700 w-full sm:max-w-2xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-white">Choose Game</SheetTitle>
                  </SheetHeader>
                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    {allGames.filter(g => g.enabled).map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onPlay={handleGameSelect}
                      />
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Balance */}
            <div className="hidden lg:block">
              <BalanceDisplay
                balance={balance}
                lastChange={lastChange}
                level={level}
                xp={xp}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Game Viewport */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGame?.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}