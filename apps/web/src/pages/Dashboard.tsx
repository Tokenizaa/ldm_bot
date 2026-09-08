import React, { useEffect, useState } from 'react';
import { 
  Chrome, 
  Facebook, 
  Bot, 
  Database, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Package,
  MessageSquare,
  Users,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface SystemStatus {
  chrome: 'online' | 'offline' | 'error';
  facebook: 'online' | 'offline' | 'error';
  ollama: 'online' | 'offline' | 'error';
  supabase: 'online' | 'offline' | 'error';
  crawler: 'running' | 'stopped' | 'error';
}

interface OperationalMetrics {
  postsToday: number;
  promotionsToday: number;
  interactionsToday: number;
  productsScraped: number;
  activeGroups: number;
  riskScore: number;
  saturationScore: number;
  lastProductScraped?: string;
  lastPublication?: string;
  recentErrors: Array<{message: string; timestamp: Date}>;
  groupsAtRisk: Array<{name: string; risk: number}>;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    chrome: 'offline',
    facebook: 'offline',
    ollama: 'offline',
    supabase: 'offline',
    crawler: 'stopped'
  });
  const [metrics, setMetrics] = useState<OperationalMetrics>({
    postsToday: 0,
    promotionsToday: 0,
    interactionsToday: 0,
    productsScraped: 0,
    activeGroups: 0,
    riskScore: 0,
    saturationScore: 0,
    recentErrors: [],
    groupsAtRisk: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemStatus();
    loadMetrics();
    
    const interval = setInterval(() => {
      loadSystemStatus();
      loadMetrics();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      // Mock system status - replace with real API calls
      const status: SystemStatus = {
        chrome: 'online',
        facebook: 'online',
        ollama: 'online',
        supabase: 'online',
        crawler: 'running'
      };
      setSystemStatus(status);
    } catch (error) {
      console.error('Error loading system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Mock metrics - replace with real API calls
      const mockMetrics: OperationalMetrics = {
        postsToday: 12,
        promotionsToday: 8,
        interactionsToday: 45,
        productsScraped: 156,
        activeGroups: 8,
        riskScore: 25,
        saturationScore: 60,
        lastProductScraped: 'Furadeira Bosch 500W',
        lastPublication: 'Parafusadeira Makita 18V - R$1.299',
        recentErrors: [
          { message: 'Facebook rate limit reached', timestamp: new Date(Date.now() - 300000) },
          { message: 'Ollama timeout on product 123', timestamp: new Date(Date.now() - 900000) }
        ],
        groupsAtRisk: [
          { name: 'Ferramentas Profissionais', risk: 75 },
          { name: 'Madeira e Construção', risk: 60 }
        ]
      };
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'offline':
      case 'stopped':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return 'text-green-400';
      case 'offline':
      case 'stopped':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'start-crawler':
          // API call to start crawler
          console.log('Starting crawler...');
          break;
        case 'pause-postings':
          // API call to pause postings
          console.log('Pausing postings...');
          break;
        case 'generate-content':
          // API call to generate content
          console.log('Generating content...');
          break;
        case 'test-ollama':
          // API call to test Ollama
          console.log('Testing Ollama...');
          break;
        case 'validate-facebook':
          // API call to validate Facebook
          console.log('Validating Facebook...');
          break;
        case 'open-chrome':
          // API call to open Chrome
          console.log('Opening Chrome...');
          break;
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    }
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
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Painel Operacional</h2>
        <p className="text-gray-400">Centro de controle do ForgeDeals Bot - Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</p>
      </header>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard
          title="Chrome"
          status={systemStatus.chrome}
          icon={<Chrome className="w-5 h-5" />}
        />
        <StatusCard
          title="Facebook"
          status={systemStatus.facebook}
          icon={<Facebook className="w-5 h-5" />}
        />
        <StatusCard
          title="Ollama"
          status={systemStatus.ollama}
          icon={<Bot className="w-5 h-5" />}
        />
        <StatusCard
          title="Supabase"
          status={systemStatus.supabase}
          icon={<Database className="w-5 h-5" />}
        />
        <StatusCard
          title="Crawler"
          status={systemStatus.crawler}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Posts Hoje"
          value={metrics.postsToday}
          icon={MessageSquare}
          trend="+15%"
          trendUp={true}
        />
        <MetricCard
          title="Promoções Hoje"
          value={metrics.promotionsToday}
          icon={TrendingUp}
          trend="+8%"
          trendUp={true}
          accent
        />
        <MetricCard
          title="Grupos Ativos"
          value={metrics.activeGroups}
          icon={Users}
          trend="+2"
          trendUp={true}
        />
        <MetricCard
          title="Produtos Rasparados"
          value={metrics.productsScraped}
          icon={Package}
          trend="+45"
          trendUp={true}
        />
      </div>

      {/* Risk Scores and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Assessment */}
        <div className="premium-card p-6">
          <h3 className="font-bold text-lg text-white mb-6">Análise de Risco</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Score de Risco Geral</span>
              <span className={cn("text-2xl font-bold", getRiskColor(metrics.riskScore))}>
                {metrics.riskScore}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Score de Saturação</span>
              <span className={cn("text-2xl font-bold", getRiskColor(metrics.saturationScore))}>
                {metrics.saturationScore}%
              </span>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white mb-3">Grupos em Risco</h4>
              <div className="space-y-2">
                {metrics.groupsAtRisk.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-surface/50 rounded">
                    <span className="text-sm text-gray-300">{group.name}</span>
                    <span className={cn("text-sm font-bold", getRiskColor(group.risk))}>
                      {group.risk}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="premium-card p-6">
          <h3 className="font-bold text-lg text-white mb-6">Atividade Recente</h3>
          <div className="space-y-4">
            <div className="p-3 bg-surface/50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-accent" />
                <span className="text-xs text-gray-400">Último Produto</span>
              </div>
              <p className="text-sm text-white font-medium">{metrics.lastProductScraped || 'N/A'}</p>
            </div>
            <div className="p-3 bg-surface/50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span className="text-xs text-gray-400">Última Publicação</span>
              </div>
              <p className="text-sm text-white font-medium">{metrics.lastPublication || 'N/A'}</p>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white mb-3">Erros Recentes</h4>
              <div className="space-y-2">
                {metrics.recentErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-xs text-red-400">{error.message}</p>
                    <p className="text-xs text-gray-500">
                      {error.timestamp.toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="premium-card p-6">
          <h3 className="font-bold text-lg text-white mb-6">Ações Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleQuickAction('start-crawler')}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Crawler
            </button>
            <button
              onClick={() => handleQuickAction('pause-postings')}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pausar Postagens
            </button>
            <button
              onClick={() => handleQuickAction('generate-content')}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Gerar Conteúdo
            </button>
            <button
              onClick={() => handleQuickAction('test-ollama')}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Testar Ollama
            </button>
            <button
              onClick={() => handleQuickAction('validate-facebook')}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              Validar Facebook
            </button>
            <button
              onClick={() => handleQuickAction('open-chrome')}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Chrome className="w-4 h-4" />
              Abrir Chrome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ title, status, icon }: { title: string; status: string; icon?: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="premium-card p-4 hover:border-accent/40 transition-colors cursor-default"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-white/5 border border-border text-gray-400">
          {icon}
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'online' || status === 'running' ? 'bg-green-400' :
          status === 'offline' || status === 'stopped' ? 'bg-red-400' :
          'bg-yellow-400'
        } animate-pulse`} />
        <span className={`text-xs font-mono ${
          status === 'online' || status === 'running' ? 'text-green-400' :
          status === 'offline' || status === 'stopped' ? 'text-red-400' :
          'text-yellow-400'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  </motion.div>
);

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
        {trendUp ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">{title}</p>
    <h4 className="text-3xl font-bold text-white tracking-tighter">{value}</h4>
  </motion.div>
);
