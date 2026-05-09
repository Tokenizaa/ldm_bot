import React from 'react';

interface StatusCardProps {
  title: string;
  status: 'online' | 'offline' | 'warning' | 'loading';
  value?: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  value,
  description,
  icon
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'loading': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'warning': return 'Atenção';
      case 'loading': return 'Carregando';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium text-gray-300">{title}</span>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      {value !== undefined && (
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
      )}
      
      <div className="text-sm text-gray-400">
        {description || getStatusText()}
      </div>
    </div>
  );
};
