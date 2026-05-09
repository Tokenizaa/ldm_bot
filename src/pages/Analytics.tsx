import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Eye, 
  MousePointer,
  Activity,
  Target,
  Zap,
  Users,
  MessageSquare,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PerformanceMetrics {
  topPosts: Array<{
    id: string;
    content: string;
    engagement: number;
    group: string;
    timestamp: Date;
    type: string;
  }>;
  bestHours: Array<{
    hour: number;
    engagement: number;
    posts: number;
  }>;
  topGroups: Array<{
    name: string;
    efficiency: number;
    posts: number;
    engagement: number;
  }>;
  estimatedCTR: number;
  topPromotions: Array<{
    product: string;
    clicks: number;
    conversions: number;
    ctr: number;
  }>;
}

interface RiskMetrics {
  saturatedGroups: Array<{
    name: string;
    saturation: number;
    risk: 'low' | 'medium' | 'high';
    lastPost: Date;
  }>;
  excessiveRepetition: Array<{
    content: string;
    count: number;
    groups: string[];
    risk: number;
  }>;
  spamRisk: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    factors: Array<{
      name: string;
      impact: number;
      status: 'warning' | 'critical' | 'safe';
    }>;
  };
  engagementDrop: Array<{
    group: string;
    drop: number;
    period: string;
    cause?: string;
  }>;
}

interface IAMetrics {
  topCopies: Array<{
    content: string;
    engagement: number;
    conversions: number;
    type: string;
    score: number;
  }>;
  topCTAs: Array<{
    text: string;
    usage: number;
    effectiveness: number;
  }>;
  topFormats: Array<{
    format: string;
    usage: number;
    engagement: number;
  }>;
  performance: {
    avgResponseTime: number;
    successRate: number;
    qualityScore: number;
  };
}

interface ProductMetrics {
  topCategories: Array<{
    category: string;
    posts: number;
    engagement: number;
    conversion: number;
  }>;
  topBrands: Array<{
    brand: string;
    posts: number;
    engagement: number;
    interaction: number;
  }>;
  ignoredProducts: Array<{
    product: string;
    reason: string;
    potential: number;
  }>;
  performance: {
    totalProducts: number;
    postedProducts: number;
    avgEngagement: number;
    conversionRate: number;
  };
}

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [risk, setRisk] = useState<RiskMetrics | null>(null);
  const [ia, setIa] = useState<IAMetrics | null>(null);
  const [products, setProducts] = useState<ProductMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalytics();
    
    const interval = setInterval(() => {
      loadAnalytics();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with real API calls
      const mockPerformance: PerformanceMetrics = {
        topPosts: [
          {
            id: '1',
            content: 'Acabei de testar esta serra circular Makita e o resultado surpreendeu...',
            engagement: 89,
            group: 'Ferramentas Profissionais',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            type: 'review'
          },
          {
            id: '2',
            content: 'Alguém já usou a parafusadeira Bosch 18V? Vale o investimento?',
            engagement: 76,
            group: 'Madeira e Construção',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            type: 'question'
          },
          {
            id: '3',
            content: 'Promoção imperdível: Kit de brotas DeWalt 50% OFF',
            engagement: 92,
            group: 'Ferramentas Profissionais',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            type: 'promotion'
          }
        ],
        bestHours: [
          { hour: 9, engagement: 85, posts: 3 },
          { hour: 13, engagement: 92, posts: 4 },
          { hour: 17, engagement: 78, posts: 2 },
          { hour: 20, engagement: 88, posts: 5 }
        ],
        topGroups: [
          { name: 'Ferramentas Profissionais', efficiency: 89, posts: 15, engagement: 85 },
          { name: 'Madeira e Construção', efficiency: 76, posts: 12, engagement: 72 },
          { name: 'Jardinagem e Paisagismo', efficiency: 65, posts: 8, engagement: 68 }
        ],
        estimatedCTR: 4.2,
        topPromotions: [
          { product: 'Parafusadeira Makita 18V', clicks: 45, conversions: 3, ctr: 6.7 },
          { product: 'Serra Circular DeWalt', clicks: 38, conversions: 2, ctr: 5.3 },
          { product: 'Furadeira Bosch 500W', clicks: 32, conversions: 1, ctr: 3.1 }
        ]
      };

      const mockRisk: RiskMetrics = {
        saturatedGroups: [
          { name: 'Ferramentas Profissionais', saturation: 78, risk: 'high', lastPost: new Date() },
          { name: 'Soldagem e Cortes', saturation: 65, risk: 'medium', lastPost: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { name: 'Madeira e Construção', saturation: 45, risk: 'low', lastPost: new Date(Date.now() - 4 * 60 * 60 * 1000) }
        ],
        excessiveRepetition: [
          { content: 'Promoção imperdível', count: 8, groups: ['Ferramentas Profissionais', 'Madeira'], risk: 65 },
          { content: 'Alguém já usou', count: 5, groups: ['Ferramentas Profissionais'], risk: 35 }
        ],
        spamRisk: {
          current: 25,
          trend: 'down',
          factors: [
            { name: 'Frequência de posts', impact: 15, status: 'safe' },
            { name: 'Variação de conteúdo', impact: 8, status: 'warning' },
            { name: 'Padrões de linguagem', impact: 2, status: 'safe' }
          ]
        },
        engagementDrop: [
          { group: 'Jardinagem e Paisagismo', drop: 15, period: 'Últimos 3 dias', cause: 'Conteúdo repetitivo' },
          { group: 'Soldagem e Cortes', drop: 8, period: 'Última semana' }
        ]
      };

      const mockIA: IAMetrics = {
        topCopies: [
          { content: 'Testei esta ferramenta e o resultado surpreendeu...', engagement: 89, conversions: 4, type: 'review', score: 92 },
          { content: 'Alguém já usou esta ferramenta? Preciso de opiniões...', engagement: 76, conversions: 2, type: 'question', score: 78 },
          { content: 'Encontrei esta oferta e não podia deixar de compartilhar...', engagement: 92, conversions: 6, type: 'promotion', score: 88 }
        ],
        topCTAs: [
          { text: 'Confira aqui', usage: 25, effectiveness: 6.2 },
          { text: 'Link na descrição', usage: 18, effectiveness: 4.8 },
          { text: 'Clique e veja', usage: 12, effectiveness: 3.9 }
        ],
        topFormats: [
          { format: 'Review pessoal', usage: 35, engagement: 88 },
          { format: 'Pergunta direta', usage: 28, engagement: 76 },
          { format: 'Promoção clara', usage: 22, engagement: 82 }
        ],
        performance: {
          avgResponseTime: 2.3,
          successRate: 94,
          qualityScore: 86
        }
      };

      const mockProducts: ProductMetrics = {
        topCategories: [
          { category: 'Ferramentas Elétricas', posts: 45, engagement: 85, conversion: 4.2 },
          { category: 'Ferramentas Manuais', posts: 28, engagement: 72, conversion: 2.8 },
          { category: 'Equipamentos de Jardinagem', posts: 15, engagement: 68, conversion: 1.9 }
        ],
        topBrands: [
          { brand: 'Makita', posts: 22, engagement: 89, interaction: 156 },
          { brand: 'Bosch', posts: 18, engagement: 82, interaction: 134 },
          { brand: 'DeWalt', posts: 15, engagement: 78, interaction: 98 }
        ],
        ignoredProducts: [
          { product: 'Kit de chaves Phillips', reason: 'Baixo engajamento', potential: 25 },
          { product: 'Lixadeira orbital', reason: 'Preço elevado', potential: 45 },
          { product: 'Serra tico-tico', reason: 'Nichos específicos', potential: 30 }
        ],
        performance: {
          totalProducts: 156,
          postedProducts: 89,
          avgEngagement: 76,
          conversionRate: 3.4
        }
      };

      setPerformance(mockPerformance);
      setRisk(mockRisk);
      setIa(mockIA);
      setProducts(mockProducts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 border-green-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface border border-border rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-surface border border-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Operacional</h1>
          <p className="text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-surface border border-border rounded-lg">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  timeRange === range
                    ? "bg-accent text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
          
          <button className="premium-button px-4 py-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Top Posts
          </h3>
          
          <div className="space-y-3">
            {performance?.topPosts.map((post, index) => (
              <div key={post.id} className="p-3 bg-surface/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-white line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{post.group}</span>
                      <span>•</span>
                      <span>{formatTime(post.timestamp)}</span>
                      <span>•</span>
                      <span className="bg-accent/20 text-accent px-2 py-0.5 rounded">
                        {post.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-green-400">{post.engagement}%</div>
                    <div className="text-xs text-gray-400">engajamento</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Melhores Horários
          </h3>
          
          <div className="space-y-3">
            {performance?.bestHours.map((hour, index) => (
              <div key={hour.hour} className="flex items-center justify-between p-3 bg-surface/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{hour.hour}h</p>
                    <p className="text-xs text-gray-400">{hour.posts} posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">{hour.engagement}%</div>
                  <div className="text-xs text-gray-400">médio engajamento</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          Análise de Risco
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Grupos Saturados</h4>
            <div className="space-y-2">
              {risk?.saturatedGroups.map((group, index) => (
                <div key={index} className={cn("p-3 rounded-lg border", getRiskBgColor(group.risk))}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium">{group.name}</span>
                    <span className={cn("text-sm font-bold", getRiskColor(group.saturation))}>
                      {group.saturation}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Último post: {formatDate(group.lastPost)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Repetição Excessiva</h4>
            <div className="space-y-2">
              {risk?.excessiveRepetition.map((item, index) => (
                <div key={index} className="p-3 bg-surface/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate flex-1">{item.content}</span>
                    <span className={cn("text-sm font-bold ml-2", getRiskColor(item.risk))}>
                      {item.risk}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Usado {item.count}x em {item.groups.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Score de Spam</h4>
            <div className="p-4 bg-surface/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Score Atual</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-2xl font-bold", getRiskColor(risk?.spamRisk.current || 0))}>
                    {risk?.spamRisk.current}%
                  </span>
                  <div className={cn(
                    "flex items-center text-xs",
                    risk?.spamRisk.trend === 'up' ? 'text-red-400' :
                    risk?.spamRisk.trend === 'down' ? 'text-green-400' : 'text-gray-400'
                  )}>
                    {risk?.spamRisk.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                     risk?.spamRisk.trend === 'down' ? <TrendingUp className="w-3 h-3 rotate-180" /> :
                     <Activity className="w-3 h-3" />}
                    {risk?.spamRisk.trend === 'up' ? 'Subindo' :
                     risk?.spamRisk.trend === 'down' ? 'Caindo' : 'Estável'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {risk?.spamRisk.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{factor.impact}%</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        factor.status === 'critical' ? 'bg-red-400' :
                        factor.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* IA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Performance IA
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{ia?.performance.avgResponseTime}s</div>
              <div className="text-xs text-gray-400">Tempo Resposta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{ia?.performance.successRate}%</div>
              <div className="text-xs text-gray-400">Taxa Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{ia?.performance.qualityScore}%</div>
              <div className="text-xs text-gray-400">Score Qualidade</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Top Copies</h4>
            <div className="space-y-2">
              {ia?.topCopies.map((copy, index) => (
                <div key={index} className="p-2 bg-surface/50 rounded">
                  <p className="text-xs text-white line-clamp-1 mb-1">{copy.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{copy.type}</span>
                    <span className="text-green-400">{copy.engagement}% engajamento</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Métricas de Produtos
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{products?.performance.totalProducts}</div>
              <div className="text-xs text-gray-400">Total Produtos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{products?.performance.postedProducts}</div>
              <div className="text-xs text-gray-400">Postados</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Top Categorias</h4>
            <div className="space-y-2">
              {products?.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-surface/50 rounded">
                  <span className="text-sm text-white">{category.category}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{category.posts} posts</span>
                    <span className="text-green-400">{category.engagement}%</span>
                    <span className="text-accent">{category.conversion}% conv</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
