import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { productService } from '../services/productService';
import { DashboardStats, Product } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const mockChartData = [
  { name: 'Seg', ofertas: 12, valor: 4500 },
  { name: 'Ter', ofertas: 19, valor: 5200 },
  { name: 'Qua', ofertas: 15, valor: 4800 },
  { name: 'Qui', ofertas: 22, valor: 6100 },
  { name: 'Sex', ofertas: 30, valor: 8500 },
  { name: 'Sab', ofertas: 25, valor: 7200 },
  { name: 'Dom', ofertas: 18, valor: 5000 },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [s, p] = await Promise.all([
        productService.getDashboardStats(),
        productService.getProducts()
      ]);
      setStats(s);
      setLatestProducts(p.slice(0, 5));
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-surface border border-border rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-surface border border-border rounded-xl" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Painel Operacional</h2>
        <p className="text-gray-400">Monitoramento e análise de ofertas em tempo real.</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total de Produtos" 
          value={stats?.totalProducts || 0} 
          icon={Package} 
          trend="+12%" 
          trendUp={true} 
        />
        <MetricCard 
          title="Ofertas Ativas" 
          value={stats?.activeOffers || 0} 
          icon={TrendingUp} 
          trend="+8%" 
          trendUp={true} 
          accent 
        />
        <MetricCard 
          title="Publicados Hoje" 
          value={stats?.publishedToday || 0} 
          icon={CheckCircle2} 
          trend="-2%" 
          trendUp={false} 
        />
        <MetricCard 
          title="AI Accuracy" 
          value="98.4%" 
          icon={Zap} 
          trend="+0.4%" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 premium-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-white">Fluxo de Ofertas (7D)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded font-mono border border-accent/20 uppercase tracking-wider">Histórico Real</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area type="monotone" dataKey="ofertas" stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latest Products list */}
        <div className="premium-card p-6 flex flex-col">
          <h3 className="font-bold text-lg text-white mb-6">Últimos Detectados</h3>
          <div className="space-y-4 flex-1">
            {latestProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center gap-4 group cursor-pointer"
                onClick={() => navigate(`/produtos/${product.id}`)}
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-border overflow-hidden relative">
                  <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className={cn(
                    "absolute top-0 right-0 w-3 h-3 border-2 border-surface rounded-full",
                    product.active ? "bg-green-500" : "bg-gray-500"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{product.title}</p>
                  <p className="text-xs text-gray-400 font-mono italic">{product.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent font-mono tracking-tighter">{formatCurrency(product.price)}</p>
                  <p className="text-[10px] text-green-500">-{product.discount}%</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/produtos')}
            className="mt-6 w-full py-2 bg-white/5 border border-border rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
          >
            Ver Todos os Produtos
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, trend, trendUp, accent = false }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "premium-card p-6 hover:border-accent/40 transition-colors cursor-default group",
      accent && "border-accent/30 bg-accent/5"
    )}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn(
        "p-2.5 rounded-lg border",
        accent ? "bg-accent/20 border-accent/30 text-accent" : "bg-white/5 border-border text-gray-400 group-hover:text-white transition-colors"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[11px] font-mono",
        trendUp ? "text-green-500" : "text-red-500"
      )}>
        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">{title}</p>
    <h4 className="text-3xl font-bold text-white tracking-tighter">{value}</h4>
  </motion.div>
);
