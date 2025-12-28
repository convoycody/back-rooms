import React from 'react';
import { Crown, Star, Sparkles, Trophy, Gem } from 'lucide-react';

const VIP_CONFIG = [
  { tier: 0, name: 'Player', color: 'slate', icon: null },
  { tier: 1, name: 'Regular', color: 'blue', icon: Star },
  { tier: 2, name: 'Insider', color: 'purple', icon: Sparkles },
  { tier: 3, name: 'High Roller', color: 'amber', icon: Trophy },
  { tier: 4, name: 'Elite', color: 'emerald', icon: Crown },
  { tier: 5, name: 'Legend', color: 'pink', icon: Gem }
];

const COLOR_CLASSES = {
  slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
};

export default function VIPBadge({ tier = 0, size = 'md', showName = false, className = '' }) {
  const config = VIP_CONFIG[tier] || VIP_CONFIG[0];
  const Icon = config.icon;
  
  if (tier === 0) return null; // Don't show badge for base tier
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${COLOR_CLASSES[config.color]} ${sizeClasses[size]} ${className}`}
      title={`VIP Tier ${tier}: ${config.name}`}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {showName ? config.name : `T${tier}`}
    </div>
  );
}