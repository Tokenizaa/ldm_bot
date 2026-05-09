import React from 'react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    old_price: number;
    image: string;
    category: string;
    brand: string;
    score?: number;
    published?: boolean;
    usageCount?: number;
    lastUsed?: Date;
  };
  onUse?: (productId: string) => void;
  onGenerateCopy?: (productId: string) => void;
  onFavorite?: (productId: string) => void;
  onIgnore?: (productId: string) => void;
  isFavorite?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onUse,
  onGenerateCopy,
  onFavorite,
  onIgnore,
  isFavorite = false
}) => {
  const discount = product.old_price > 0 
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score?: number) => {
    if (!score) return '';
    if (score >= 80) return '🔥';
    if (score >= 60) return '⭐';
    return '📉';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      {/* Imagem */}
      <div className="relative h-48 bg-gray-700">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-product.png';
          }}
        />
        
        {/* Badge de desconto */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
            -{discount}%
          </div>
        )}
        
        {/* Badge de score */}
        {product.score && (
          <div className="absolute top-2 left-2 bg-gray-900/90 text-white px-2 py-1 rounded text-sm font-bold flex items-center gap-1">
            <span className={getScoreColor(product.score)}>
              {getScoreIcon(product.score)}
            </span>
            <span className={getScoreColor(product.score)}>
              {product.score}
            </span>
          </div>
        )}
        
        {/* Status de publicado */}
        {product.published && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
            Publicado
          </div>
        )}
      </div>
      
      {/* Informações */}
      <div className="p-4">
        <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-green-400">
            R$ {product.price.toFixed(2)}
          </span>
          {product.old_price > product.price && (
            <span className="text-sm text-gray-500 line-through">
              R$ {product.old_price.toFixed(2)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <span className="bg-gray-700 px-2 py-1 rounded">
            {product.category}
          </span>
          <span className="bg-gray-700 px-2 py-1 rounded">
            {product.brand}
          </span>
        </div>
        
        {/* Estatísticas de uso */}
        {(product.usageCount !== undefined || product.lastUsed) && (
          <div className="text-xs text-gray-500 mb-3">
            {product.usageCount !== undefined && (
              <span>Usado {product.usageCount}x</span>
            )}
            {product.usageCount && product.lastUsed && <span> • </span>}
            {product.lastUsed && (
              <span>
                Último: {new Date(product.lastUsed).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        )}
        
        {/* Ações */}
        <div className="flex gap-2">
          <button
            onClick={() => onUse?.(product.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Usar
          </button>
          
          <button
            onClick={() => onGenerateCopy?.(product.id)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Copy
          </button>
          
          <button
            onClick={() => onFavorite?.(product.id)}
            className={`p-2 rounded transition-colors ${
              isFavorite 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
          
          <button
            onClick={() => onIgnore?.(product.id)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
