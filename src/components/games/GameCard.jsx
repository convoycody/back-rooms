import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Lock, Clock } from 'lucide-react';

export default function GameCard({ game, onPlay }) {
  const isDisabled = !game.enabled || game.coming_soon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`bg-slate-900/50 border-slate-700/50 overflow-hidden group relative ${
        isDisabled ? 'opacity-60' : 'hover:border-amber-500/30'
      }`}>
        {/* Hero Image */}
        <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
          {game.artwork_url ? (
            <img 
              src={game.artwork_url} 
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {game.icon || '🎮'}
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />
          
          {/* Status badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {game.featured && (
              <Badge className="bg-amber-500/90 text-black font-bold">Featured</Badge>
            )}
            {game.coming_soon && (
              <Badge className="bg-blue-500/90 text-white"><Clock className="w-3 h-3 mr-1" />Coming Soon</Badge>
            )}
          </div>

          {/* Play overlay on hover */}
          {!isDisabled && (
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <Button
                  onClick={() => onPlay(game)}
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-lg px-8 py-6 shadow-2xl shadow-amber-500/50"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Play Now
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mb-1">{game.name}</h3>
              <p className="text-slate-400 text-sm">{game.tagline}</p>
            </div>
            <Badge variant="outline" className="ml-2 capitalize">
              {game.category}
            </Badge>
          </div>

          {game.description && (
            <p className="text-slate-500 text-xs mt-2 line-clamp-2">{game.description}</p>
          )}

          {isDisabled && (
            <div className="mt-3 flex items-center gap-2 text-slate-500 text-sm">
              <Lock className="w-4 h-4" />
              {game.coming_soon ? 'Coming Soon' : 'Currently Unavailable'}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}