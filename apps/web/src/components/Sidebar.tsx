import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Calendar, 
  Package, 
  Settings 
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Facebook', href: '/facebook', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Ollama', href: '/ollama', icon: Brain },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-white">ForgeDeals Bot</h1>
        <p className="text-xs text-gray-400 mt-1">Operational Control Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-gray-400 text-center">
          <div className="mb-2">System Status</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
