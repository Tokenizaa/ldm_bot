import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Target, 
  Settings, 
  BarChart3, 
  Zap,
  Hammer,
  Cpu,
  Monitor,
  Code,
  Link2
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Package, label: 'Produtos', to: '/produtos' },
    { icon: Cpu, label: 'Automação', to: '/automacao' },
    { icon: Monitor, label: 'Crawler Engine', to: '/crawler' },
    { icon: Code, label: 'Playwright Specs', to: '/worker-docs' },
    { icon: Link2, label: 'Affiliate Engine', to: '/affiliate-engine' },
    { icon: Target, label: 'Ofertas Ativas', to: '/ofertas' },
    { icon: BarChart3, label: 'Relatórios', to: '/relatorios' },
    { icon: Settings, label: 'Configurações', to: '/configuracoes' },
  ];

  return (
    <div className="w-64 min-h-screen bg-surface border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
          <Hammer className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-white">ForgeDeals</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-mono">Engine AI</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                isActive 
                  ? "bg-accent/10 text-accent border border-accent/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.label === 'Ofertas Ativas' && (
              <span className="ml-auto bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold animate-pulse">
                LIVE
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-semibold text-white">AI Status</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-accent h-full w-3/4 rounded-full" />
          </div>
          <p className="text-[10px] mt-2 text-gray-400">75% da cota mensal utilizada</p>
        </div>
      </div>
    </div>
  );
};
