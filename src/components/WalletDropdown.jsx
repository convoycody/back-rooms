import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, Coins, Zap, Gift, Fuel } from 'lucide-react';
import VIPBadge from '@/components/VIPBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

export default function WalletDropdown({ balance, vipTier, lastChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 sm:px-4 py-2">
          <div className="text-right">
            <p className="text-xs text-slate-400 hidden sm:block">Balance</p>
            <p className="text-base sm:text-lg font-black text-amber-400" style={{ wordBreak: 'break-all' }}>
              {typeof balance === 'number' ? balance.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-slate-700">
        <div className="p-3 border-b border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Your Balance</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 break-all">
            {typeof balance === 'number' ? balance.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <VIPBadge tier={vipTier || 0} size="sm" />
            {lastChange !== 0 && (
              <span className={`text-xs font-bold ${lastChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {lastChange > 0 ? '+' : ''}{lastChange}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <Link to={createPageUrl('BTCStore')}>
          <DropdownMenuItem className="cursor-pointer">
            <Zap className="w-4 h-4 mr-2 text-amber-400" />
            <span className="text-white">Buy with Bitcoin</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator className="bg-slate-700" />

        <div className="p-2">
          <p className="text-xs text-slate-500 px-2">Free Points</p>
        </div>

        <DropdownMenuItem className="cursor-default hover:bg-transparent focus:bg-transparent">
          <Gift className="w-4 h-4 mr-2 text-purple-400" />
          <div className="flex-1">
            <p className="text-white text-sm">Daily Bonus</p>
            <p className="text-xs text-slate-400">Claim in sidebar</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-default hover:bg-transparent focus:bg-transparent">
          <Fuel className="w-4 h-4 mr-2 text-amber-400" />
          <div className="flex-1">
            <p className="text-white text-sm">Auto Top-Up</p>
            <p className="text-xs text-slate-400">When balance is low</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}