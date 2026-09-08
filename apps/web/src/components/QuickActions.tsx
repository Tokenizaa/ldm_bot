import React from 'react';

interface QuickActionsProps {
  onStartCrawler?: () => void;
  onGeneratePost?: () => void;
  onForcePublish?: () => void;
  onRegenerateCopy?: () => void;
  crawlerRunning?: boolean;
  postGenerating?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onStartCrawler,
  onGeneratePost,
  onForcePublish,
  onRegenerateCopy,
  crawlerRunning = false,
  postGenerating = false
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button
        onClick={onStartCrawler}
        disabled={crawlerRunning}
        className={`px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
          crawlerRunning
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {crawlerRunning ? (
          <>
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            Rodando
          </>
        ) : (
          <>
            🔍 Iniciar Crawler
          </>
        )}
      </button>
      
      <button
        onClick={onGeneratePost}
        disabled={postGenerating}
        className={`px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
          postGenerating
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {postGenerating ? (
          <>
            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
            Gerando
          </>
        ) : (
          <>
            📝 Gerar Post
          </>
        )}
      </button>
      
      <button
        onClick={onForcePublish}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors"
      >
        🚀 Forçar Pub.
      </button>
      
      <button
        onClick={onRegenerateCopy}
        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors"
      >
        🔄 Regerar Copy
      </button>
    </div>
  );
};
