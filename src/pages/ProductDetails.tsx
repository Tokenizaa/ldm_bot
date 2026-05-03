import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Send, 
  TrendingDown, 
  ShieldCheck, 
  Cpu,
  History,
  Info,
  BadgePercent,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { productService } from '../services/productService';
import { Product, PriceHistory } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion } from 'motion/react';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [p, h] = await Promise.all([
        productService.getProductById(id),
        productService.getPriceHistory(id)
      ]);
      setProduct(p);
      setHistory(h);
      setLoading(false);
    }
    load();
  }, [id]);

  const copyLink = () => {
    if (!product) return;
    navigator.clipboard.writeText(product.affiliate_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 italic">Carregando especificações técnicas...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Produto não encontrado na base de dados.</div>;

  const chartData = history.map(h => ({
    date: new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    price: h.price
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto max-h-[calc(100vh-64px)] pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Voltar para listagem</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Gallery and Info */}
        <div className="lg:col-span-7 space-y-8">
          <div className="premium-card p-4 aspect-video overflow-hidden group">
            <img 
              src={product.image} 
              alt={product.title} 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          <div className="premium-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-accent" />
                Descrição Gerada por IA
              </h3>
              <div className="bg-accent/10 border border-accent/30 text-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Processado via Gemini Pro
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              {product.ai_description || 'Analisando características técnicas do produto para gerar resumo otimizado...'}
            </p>
            
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex gap-4">
              <div className="p-3 bg-accent/20 rounded-lg shrink-0">
                <Cpu className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Recomendação ForgeDeals</h4>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  "Este item apresenta um excelente score de oportunidade ({product.ai_score}/100) baseado no histórico de preços e demanda da categoria {product.category}."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions and Pricing */}
        <div className="lg:col-span-5 space-y-8">
          <div className="premium-card p-6 space-y-6 sticky top-24">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <span className="text-xs text-accent font-bold uppercase tracking-widest">{product.brand}</span>
                   <span className="text-gray-600">|</span>
                   <span className="text-xs text-gray-400 font-medium">{product.category}</span>
                </div>
                <h1 className="text-2xl font-bold text-white leading-tight">{product.title}</h1>
             </div>

             <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                <div>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Preço Atual</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white font-mono tracking-tighter">{formatCurrency(product.price)}</span>
                      <span className="text-sm text-gray-500 line-through">{formatCurrency(product.old_price)}</span>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20 mb-2">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-xs font-bold">{formatPercent(product.discount)} OFF</span>
                   </div>
                   <div className="flex items-center gap-1 text-blue-400 text-[10px] font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      Menor preço 30 dias
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => window.open(product.original_url, '_blank')}
                  className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
                >
                   <ExternalLink className="w-4 h-4" />
                   Loja Original
                </button>
                <button 
                  onClick={copyLink}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all text-sm",
                    copied ? "bg-green-500/10 border-green-500 text-green-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                   {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   {copied ? 'Copiado!' : 'Link Afiliado'}
                </button>
             </div>

             <button className="w-full flex items-center justify-center gap-2 bg-accent text-white py-4 rounded-xl font-bold shadow-lg shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all">
                <Send className="w-5 h-5" />
                Publicar no Telegram
             </button>

             {/* Price History Chart */}
             <div className="pt-6 border-t border-border mt-6">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Variação de Preço
                   </h4>
                   <span className="text-[10px] items-center gap-1 text-green-500 px-2 border border-green-500/20 rounded-full font-mono flex">
                      Oportunidade
                   </span>
                </div>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="price" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '4px', fontSize: '10px' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
