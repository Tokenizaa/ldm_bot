import React from 'react';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    type: 'promotion' | 'educational' | 'engagement' | 'institutional';
    category: string;
    productTitle: string;
    productImage: string;
    createdAt: Date;
    status: 'pending' | 'posted' | 'failed' | 'manual';
    facebookPostId?: string;
  };
  onEdit?: (postId: string) => void;
  onRegenerate?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onMarkBad?: (postId: string) => void;
  onApprove?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onEdit,
  onRegenerate,
  onRepost,
  onMarkBad,
  onApprove
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-green-600';
      case 'educational': return 'bg-blue-600';
      case 'engagement': return 'bg-purple-600';
      case 'institutional': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion': return '🔥';
      case 'educational': return '📚';
      case 'engagement': return '💬';
      case 'institutional': return '🏢';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'manual': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'posted': return 'Publicado';
      case 'pending': return 'Aguardando';
      case 'failed': return 'Falhou';
      case 'manual': return 'Manual';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getTypeColor(post.type)}`}>
              {getTypeIcon(post.type)} {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
            </span>
            <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
              {post.category}
            </span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(post.status)}`}>
            {getStatusText(post.status)}
          </span>
        </div>
        
        <div className="text-sm text-gray-400">
          {new Date(post.createdAt).toLocaleString('pt-BR')}
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        <div className="flex gap-4 mb-4">
          <img
            src={post.productImage}
            alt={post.productTitle}
            className="w-20 h-20 object-cover rounded-lg bg-gray-700"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-product.png';
            }}
          />
          
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
              {post.productTitle}
            </h4>
            <div className="text-gray-300 text-sm leading-relaxed">
              {post.content}
            </div>
          </div>
        </div>
        
        {/* ID do Facebook */}
        {post.facebookPostId && (
          <div className="text-xs text-gray-500 mb-3">
            Facebook ID: {post.facebookPostId}
          </div>
        )}
        
        {/* Ações */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onEdit?.(post.id)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Editar
          </button>
          
          <button
            onClick={() => onRegenerate?.(post.id)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Regerar
          </button>
          
          <button
            onClick={() => onRepost?.(post.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Repostar
          </button>
          
          <button
            onClick={() => onMarkBad?.(post.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Ruim
          </button>
          
          {post.status === 'manual' && (
            <button
              onClick={() => onApprove?.(post.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Aprovar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
