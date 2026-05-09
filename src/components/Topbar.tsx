import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export const Topbar: React.FC = () => {
  return (
    <div className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent/50 focus:bg-white/10"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-white">Admin</div>
            <div className="text-xs text-gray-400">System Operator</div>
          </div>
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-accent" />
          </div>
        </div>
      </div>
    </div>
  );
};
