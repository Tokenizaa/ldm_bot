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
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await productService.getProducts();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todas', ...new Set(products.map(p => p.category))];

  return (
    <div className="p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Repositório de Produtos</h2>
          <p className="text-gray-400">Gerencie o catálogo completo e prepare publicações.</p>
        </div>
        <button className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20">
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
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
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Score AI</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500 italic">Sincronizando com a base técnica...</p>
                  </td>
                </tr>
              ) : filteredProducts.map((p) => (
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
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={cn(
                          "h-full rounded-full animate-in slide-in-from-left duration-1000",
                          (p.ai_score || 0) > 85 ? "bg-accent" : (p.ai_score || 0) > 70 ? "bg-blue-500" : "bg-gray-500"
                        )} style={{ width: `${p.ai_score}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-300">{p.ai_score || 0}/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "w-2 h-2 rounded-full",
                         p.active ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-600"
                       )} />
                       <span className="text-xs text-gray-300 font-medium">{p.active ? 'Monitorando' : 'Inativo'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 isolate">
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
                      <button className="p-2 text-accent bg-accent/5 hover:bg-accent/20 border border-accent/20 rounded-lg transition-all" title="Publicar Agora">
                        <Send className="w-4 h-4" />
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
