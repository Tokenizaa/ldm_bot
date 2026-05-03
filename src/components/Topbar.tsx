import React from 'react';
import { Search, Bell, User, Calendar } from 'lucide-react';

export const Topbar = () => {
  return (
    <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar produtos, marcas ou categorias..." 
            className="w-full bg-white/5 border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:border-accent/50 focus:bg-white/10 transition-all font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 border-r border-border pr-6">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-surface" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-semibold text-white leading-none">Admin Forge</p>
            <p className="text-[10px] text-accent uppercase font-mono mt-1 tracking-wider">Superuser</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <User className="text-accent w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
