import React from 'react';

interface ActivityItem {
  id: string;
  type: 'crawler' | 'post' | 'error' | 'success' | 'system';
  title: string;
  description?: string;
  timestamp: Date;
  details?: any;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  activities, 
  maxItems = 10 
}) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'crawler': return '🔍';
      case 'post': return '📝';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'crawler': return 'text-blue-400';
      case 'post': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'system': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const sortedActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  return (
    <div className="space-y-3">
      {sortedActivities.map((activity) => (
        <div key={activity.id} className="flex gap-3 items-start">
          <div className={`text-lg ${getActivityColor(activity.type)} flex-shrink-0 mt-1`}>
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-white truncate">
                {activity.title}
              </h4>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTime(activity.timestamp)}
              </span>
            </div>
            
            {activity.description && (
              <p className="text-sm text-gray-400 mt-1">
                {activity.description}
              </p>
            )}
            
            {activity.details && (
              <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(activity.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {sortedActivities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma atividade recente
        </div>
      )}
    </div>
  );
};
