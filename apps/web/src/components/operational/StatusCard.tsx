import React from 'react';
import { cn } from '../../lib/utils';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status: 'online' | 'offline' | 'warning' | 'loading';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  status,
  icon,
  trend,
  className
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'loading': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'online': return 'bg-green-500/20 border-green-500/30';
      case 'offline': return 'bg-red-500/20 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'loading': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <div className={cn("premium-card p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        {icon && <div className="text-accent">{icon}</div>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={cn(
            "text-sm",
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-gray-400'
          )}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
      )}
      <div className={cn(
        "flex items-center gap-2 mt-2",
        getStatusColor()
      )}>
        <div className={cn("w-2 h-2 rounded-full", getStatusBg())} />
        <span className="text-xs font-mono uppercase">{status}</span>
      </div>
    </div>
  );
};
