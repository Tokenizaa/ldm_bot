import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  Users,
  Package,
  MessageSquare,
  Eye,
  Activity,
  Calendar,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfig } from '../hooks/useConfig';
import { cn } from '../lib/utils';

interface OperationalMetrics {
  categoriasMaisUsadas: Array<{ categoria: string; count: number; percentage: number }>;
  produtosMaisPostados: Array<{ produto: string; count: number; score: number }>;
  scoreMedio: number;
  saturacao: number;
  frequenciaMarcas: Array<{ marca: string; count: number }>;
  horariosUtilizados: Array<{ hora: number; count: number }>;
  tiposPost: Array<{ tipo: string; count: number; engagement: number }>;
  riscoOperacional: number;
  postsHoje: number;
  limiteDiario: number;
  taxaSucesso: number;
  tempoMedioResposta: number;
  gruposAtivos: number;
  produtosProcessados: number;
}

export const OperationalAnalytics = () => {
  const { config } = useConfig();
  const [metrics, setMetrics] = useState<OperationalMetrics>({
    categoriasMaisUsadas: [],
    produtosMaisPostados: [],
    scoreMedio: 0,
    saturacao: 0,
    frequenciaMarcas: [],
    horariosUtilizados: [],
    tiposPost: [],
    riscoOperacional: 0,
    postsHoje: 0,
    limiteDiario: 10,
    taxaSucesso: 0,
    tempoMedioResposta: 0,
    gruposAtivos: 0,
    produtosProcessados: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update a cada 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simulação de dados - substituir com API real
      const mockMetrics: OperationalMetrics = {
        categoriasMaisUsadas: [
          { categoria: 'Ferramentas Elétricas', count: 45, percentage: 35 },
          { categoria: 'Ferramentas Manuais', count: 32, percentage: 25 },
          { categoria: 'Automotivo', count: 28, percentage: 22 },
          { categoria: 'Soldas', count: 23, percentage: 18 }
        ],
        produtosMaisPostados: [
          { produto: 'Parafusadeira Bosch GSB 18V', count: 8, score: 85 },
          { produto: 'Chave de Fenda Makita', count: 6, score: 72 },
          { produto: 'Serra Circular DeWalt', count: 5, score: 78 }
        ],
        scoreMedio: 68,
        saturacao: 65,
        frequenciaMarcas: [
          { marca: 'Bosch', count: 28 },
          { marca: 'Makita', count: 24 },
          { marca: 'DeWalt', count: 18 },
          { marca: 'Stanley', count: 15 }
        ],
        horariosUtilizados: [
          { hora: 9, count: 12 },
          { hora: 13, count: 18 },
          { hora: 17, count: 15 },
          { hora: 20, count: 8 }
        ],
        tiposPost: [
          { tipo: 'Promocional', count: 45, engagement: 4.2 },
          { tipo: 'Educativo', count: 30, engagement: 6.8 },
          { tipo: 'Engajamento', count: 25, engagement: 8.5 },
          { tipo: 'Institucional', count: 10, engagement: 2.1 }
        ],
        riscoOperacional: 25,
        postsHoje: 7,
        limiteDiario: config.facebook.postsPerDay,
        taxaSucesso: 92,
        tempoMedioResposta: 2.3,
        gruposAtivos: config.facebook.activeGroups.filter(g => g.active).length,
        produtosProcessados: 156
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-400';
    if (risk < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskIcon = (risk: number) => {
    if (risk < 30) return CheckCircle2;
    if (risk < 60) return AlertTriangle;
    return AlertTriangle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Operacional</h1>
          <p className="text-gray-400">Métricas de performance e operação</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['24h', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 rounded-md transition-colors",
                  timeRange === range
                    ? "bg-accent text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {range === '24h' ? '24h' : range === '7d' ? '7 dias' : '30 dias'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Posts Hoje"
          value={`${metrics.postsHoje}/${metrics.limiteDiario}`}
          subtitle={`${Math.round((metrics.postsHoje / metrics.limiteDiario) * 100)}% do limite`}
          icon={MessageSquare}
          color="accent"
        />
        
        <KPICard
          title="Taxa de Sucesso"
          value={`${metrics.taxaSucesso}%`}
          subtitle="Publicações bem-sucedidas"
          icon={CheckCircle2}
          color="green"
        />
        
        <KPICard
          title="Score Médio"
          value={metrics.scoreMedio}
          subtitle="Qualidade dos produtos"
          icon={Target}
          color="blue"
        />
        
        <KPICard
          title="Risco Operacional"
          value={`${metrics.riscoOperacional}%`}
          subtitle={metrics.riscoOperacional < 30 ? 'Baixo risco' : metrics.riscoOperacional < 60 ? 'Risco moderado' : 'Alto risco'}
          icon={getRiskIcon(metrics.riscoOperacional)}
          color={getRiskColor(metrics.riscoOperacional)}
        />
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Categorias Mais Usadas */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Categorias Mais Usadas
          </h3>
          <div className="space-y-3">
            {metrics.categoriasMaisUsadas.map((cat, index) => (
              <div key={cat.categoria} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-6">#{index + 1}</span>
                  <span className="text-white">{cat.categoria}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-12">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produtos Mais Postados */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produtos Mais Postados
          </h3>
          <div className="space-y-3">
            {metrics.produtosMaisPostados.map((produto, index) => (
              <div key={produto.produto} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-6">#{index + 1}</span>
                  <div>
                    <div className="text-white text-sm">{produto.produto}</div>
                    <div className="text-gray-400 text-xs">Score: {produto.score}</div>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{produto.count} posts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frequência de Marcas */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Frequência de Marcas
          </h3>
          <div className="space-y-3">
            {metrics.frequenciaMarcas.map((marca, index) => (
              <div key={marca.marca} className="flex items-center justify-between">
                <span className="text-white">{marca.marca}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(marca.count / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8">{marca.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tipos de Post */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Tipos de Post e Engajamento
          </h3>
          <div className="space-y-3">
            {metrics.tiposPost.map((tipo, index) => (
              <div key={tipo.tipo} className="flex items-center justify-between">
                <div>
                  <div className="text-white">{tipo.tipo}</div>
                  <div className="text-gray-400 text-xs">Engajamento: {tipo.engagement}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(tipo.engagement / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8">{tipo.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horários Utilizados */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários Mais Utilizados
          </h3>
          <div className="space-y-3">
            {metrics.horariosUtilizados.map((horario) => (
              <div key={horario.hora} className="flex items-center justify-between">
                <span className="text-white">{horario.hora}h</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(horario.count / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8">{horario.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Operacional */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Status Operacional
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Grupos Ativos</span>
              <span className="text-white font-medium">{metrics.gruposAtivos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Produtos Processados</span>
              <span className="text-white font-medium">{metrics.produtosProcessados}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Saturação</span>
              <span className="text-white font-medium">{metrics.saturacao}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tempo Médio Resposta</span>
              <span className="text-white font-medium">{metrics.tempoMedioResposta}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-gray-800 rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-gray-400 text-sm">{title}</span>
      <Icon className={`w-5 h-5 text-${color}-400`} />
    </div>
    <div className={`text-2xl font-bold text-${color}-400 mb-1`}>{value}</div>
    <div className="text-gray-400 text-sm">{subtitle}</div>
  </div>
);
