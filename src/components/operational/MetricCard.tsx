import React from 'react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'accent' | 'green' | 'yellow' | 'red' | 'blue';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'accent',
  trend,
  className
}) => {
  const getColorClass = () => {
    switch (color) {
      case 'accent': return 'text-accent';
      case 'green': return 'text-green-400';
      case 'yellow': return 'text-yellow-400';
      case 'red': return 'text-red-400';
      case 'blue': return 'text-blue-400';
      default: return 'text-accent';
    }
  };

  const getBgColorClass = () => {
    switch (color) {
      case 'accent': return 'bg-accent/20 border-accent/30';
      case 'green': return 'bg-green-500/20 border-green-500/30';
      case 'yellow': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'red': return 'bg-red-500/20 border-red-500/30';
      case 'blue': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-accent/20 border-accent/30';
    }
  };

  return (
    <div className={cn("premium-card p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        {icon && <div className={getColorClass()}>{icon}</div>}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-2xl font-bold", getColorClass())}>{value}</span>
        {trend && (
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xs",
              trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            )}>
              {trend.direction === 'up' ? '↗' : '↘'}
            </span>
            <span className={cn(
              "text-xs",
              trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            )}>
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
      )}
    </div>
  );
};
