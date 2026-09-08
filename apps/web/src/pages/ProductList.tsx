import React, { useEffect, useState } from 'react';
import { 
  Filter, 
  Search, 
  Plus, 
  MoreHorizontal, 
  ExternalLink, 
  Copy,
  Eye,
  Send,
  Loader2,
  Check,
  TrendingUp,
  Users,
  Target,
  Zap,
  AlertTriangle,
  Star,
  Heart,
  MessageSquare,
  BarChart3,
  Play,
  Pause,
  Bookmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductWithScores extends Product {
  viralScore: number;
  promotionScore: number;
  communityScore: number;
  engagementPotential: number;
  category: string;
  brand: string;
  postedCount: number;
  lastPosted?: Date;
  performance: {
    avgEngagement: number;
    avgCTR: number;
    conversions: number;
  };
}

interface ProductActions {
  generateCopy: (productId: string) => void;
  postNow: (productId: string) => void;
  favorite: (productId: string) => void;
  ignore: (productId: string) => void;
  blockCategory: (category: string) => void;
}

export const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'viral' | 'promotion' | 'community' | 'engagement' | 'recent'>('engagement');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithScores | null>(null);

  useEffect(() => {
    async function load() {
      const data = await productService.getProducts();
      // Transform data to include scores
      const productsWithScores: ProductWithScores[] = data.map((product, index) => ({
        ...product,
        viralScore: Math.floor(Math.random() * 30) + 70,
        promotionScore: Math.floor(Math.random() * 25) + 75,
        communityScore: Math.floor(Math.random() * 20) + 80,
        engagementPotential: Math.floor(Math.random() * 40) + 60,
        category: 'Ferramentas Elétricas',
        brand: 'Makita',
        postedCount: Math.floor(Math.random() * 5),
        lastPosted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        performance: {
          avgEngagement: Math.floor(Math.random() * 30) + 70,
          avgCTR: Math.random() * 5 + 2,
          conversions: Math.floor(Math.random() * 10)
        }
      }));
      setProducts(productsWithScores);
      setLoading(false);
    }
    load();
  }, []);

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleProductAction = (action: keyof ProductActions, productId: string, extra?: string) => {
    console.log(`Action ${action} on product ${productId}`, extra);
    // Implement actions
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'viral': return b.viralScore - a.viralScore;
      case 'promotion': return b.promotionScore - a.promotionScore;
      case 'community': return b.communityScore - a.communityScore;
      case 'engagement': return b.engagementPotential - a.engagementPotential;
      case 'recent': return new Date(b.lastPosted || 0).getTime() - new Date(a.lastPosted || 0).getTime();
      default: return 0;
    }
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todas', ...new Set(products.map(p => p.category))];

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Produtos com Inteligência</h2>
          <p className="text-gray-400">Catálogo enriquecido com scores de engajamento e performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-white"
          >
            <option value="engagement">Maior Engajamento</option>
            <option value="viral">Maior Potencial Viral</option>
            <option value="promotion">Melhor Promoção</option>
            <option value="community">Maior Comunidade</option>
            <option value="recent">Mais Recentes</option>
          </select>
          <button className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20">
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrar por nome, marca ou modelo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-accent/50 focus:bg-white/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white/5 border border-border rounded-lg py-2.5 px-4 text-sm text-gray-300 focus:border-accent/50 min-w-[180px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex-none bg-white/5 border border-border rounded-lg py-2.5 px-4 text-sm text-gray-300">
          <span className="text-gray-500 mr-2 font-mono">Total:</span>
          <span className="text-white font-bold">{filteredProducts.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-border">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Produto</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Categoria/Marca</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Precificação</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Scores</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Performance</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500 italic">Analisando produtos com IA...</p>
                  </td>
                </tr>
              ) : sortedProducts.map((p) => (
                <tr 
                  key={p.id} 
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => navigate(`/produtos/${p.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/5 border border-border p-1">
                        <img src={p.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="max-w-[240px]">
                        <p className="text-sm font-bold text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {p.id.padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 font-bold uppercase tracking-tight">{p.category}</span>
                    <p className="text-xs text-gray-300 mt-1.5 font-medium">{p.brand}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white font-mono leading-none">{formatCurrency(p.price)}</span>
                      <span className="text-[10px] text-gray-500 line-through mt-1">{formatCurrency(p.old_price)}</span>
                      <span className="text-[10px] text-green-500 font-bold mt-0.5">↓ {formatPercent(p.discount)} OFF</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Viral</div>
                        <div className={cn("text-sm font-bold", getScoreColor(p.viralScore))}>
                          {p.viralScore}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Promo</div>
                        <div className={cn("text-sm font-bold", getScoreColor(p.promotionScore))}>
                          {p.promotionScore}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Comun</div>
                        <div className={cn("text-sm font-bold", getScoreColor(p.communityScore))}>
                          {p.communityScore}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Engaj</div>
                        <div className={cn("text-sm font-bold", getScoreColor(p.engagementPotential))}>
                          {p.engagementPotential}%
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Engajamento</span>
                        <span className={getScoreColor(p.performance.avgEngagement)}>
                          {p.performance.avgEngagement}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">CTR</span>
                        <span className="text-green-400">
                          {p.performance.avgCTR.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Conversões</span>
                        <span className="text-accent">
                          {p.performance.conversions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Postagens</span>
                        <span className="text-white">{p.postedCount}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleProductAction('generateCopy', p.id)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" 
                        title="Gerar Copy"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleProductAction('postNow', p.id)}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all" 
                        title="Postar Agora"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleProductAction('favorite', p.id)}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all" 
                        title="Favoritar"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleProductAction('ignore', p.id)}
                        className="p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition-all" 
                        title="Ignorar"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleProductAction('blockCategory', p.id, p.category)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" 
                        title="Bloquear Categoria"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Ver Detalhes">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => copyLink(p.id, p.affiliate_url)}
                        className={cn(
                          "p-2 rounded-lg transition-all border",
                          copiedId === p.id 
                            ? "border-green-500/50 bg-green-500/10 text-green-500" 
                            : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                        )} 
                        title="Copiar Link"
                      >
                        {copiedId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-xs text-gray-500">
          <span>Mostrando {filteredProducts.length} de {products.length} registros</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white/5 border border-border rounded hover:text-white disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 bg-white/5 border border-border rounded hover:text-white disabled:opacity-50" disabled>Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
};
