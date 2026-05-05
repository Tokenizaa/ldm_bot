import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Bot, 
  Eye,
  MousePointer,
  Activity,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SocialMetrics {
  postsToday: number;
  averageSpamScore: number;
  groupsOnCooldown: number;
  averageEngagement: number;
  averageCTR: number;
  estimatedReach: number;
  safestHours: number[];
  rejectedPosts: number;
  activeAgents: number;
  ollamaStatus: 'online' | 'offline' | 'error';
  queueSize: number;
  successRate: number;
}

interface ScheduledPost {
  id: string;
  content: string;
  scheduledTime: Date;
  type: string;
  group: string;
  status: 'pending' | 'published' | 'failed';
  spamRisk: number;
  engagement: number;
}

export const SocialControlCenter = () => {
  const [metrics, setMetrics] = useState<SocialMetrics>({
    postsToday: 0,
    averageSpamScore: 0,
    groupsOnCooldown: 0,
    averageEngagement: 0,
    averageCTR: 0,
    estimatedReach: 0,
    safestHours: [],
    rejectedPosts: 0,
    activeAgents: 0,
    ollamaStatus: 'offline',
    queueSize: 0,
    successRate: 0
  });

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    loadScheduledPosts();
    
    const interval = setInterval(() => {
      loadMetrics();
      loadScheduledPosts();
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // Simulação de dados - em produção viria da API
      const mockMetrics: SocialMetrics = {
        postsToday: 3,
        averageSpamScore: 25,
        groupsOnCooldown: 2,
        averageEngagement: 85,
        averageCTR: 4.2,
        estimatedReach: 1250,
        safestHours: [9, 13, 20],
        rejectedPosts: 1,
        activeAgents: 5,
        ollamaStatus: 'online',
        queueSize: 8,
        successRate: 92
      };
      
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScheduledPosts = async () => {
    try {
      // Simulação de posts agendados
      const mockPosts: ScheduledPost[] = [
        {
          id: '1',
          content: 'Essa Bosch apareceu abaixo do preço que costumo acompanhar...',
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          type: 'offer',
          group: 'Ferramentas Profissionais',
          status: 'pending',
          spamRisk: 15,
          engagement: 0
        },
        {
          id: '2',
          content: 'Alguém já usou a parafusadeira Makita 18V?',
          scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          type: 'question',
          group: 'Ferramentas Profissionais',
          status: 'pending',
          spamRisk: 8,
          engagement: 0
        },
        {
          id: '3',
          content: 'Testei esta serra circular e o resultado surpreendeu...',
          scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          type: 'review',
          group: 'Madeira e Construção',
          status: 'pending',
          spamRisk: 12,
          engagement: 0
        }
      ];
      
      setScheduledPosts(mockPosts);
    } catch (error) {
      console.error('Erro ao carregar posts agendados:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'error': return 'text-red-500';
      case 'pending': return 'text-yellow-400';
      case 'published': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSpamRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-white">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Social Control Center</h1>
            <p className="text-gray-400">
              Última atualização: {formatTime(lastUpdate)}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="premium-button px-4 py-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button className="premium-button px-4 py-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <span className="text-2xl font-bold text-white">{metrics.postsToday}</span>
            </div>
            <h3 className="text-gray-400 text-sm">Posts Hoje</h3>
            <div className="flex items-center mt-2 text-xs text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2 vs ontem
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <span className={cn("text-2xl font-bold", getSpamRiskColor(metrics.averageSpamScore))}>
                {metrics.averageSpamScore}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Score Spam Médio</h3>
            <div className="flex items-center mt-2 text-xs text-gray-400">
              <Activity className="w-3 h-3 mr-1" />
              Seguro
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">{metrics.groupsOnCooldown}</span>
            </div>
            <h3 className="text-gray-400 text-sm">Grupos em Cooldown</h3>
            <div className="flex items-center mt-2 text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              24h restantes
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">{metrics.averageCTR}%</span>
            </div>
            <h3 className="text-gray-400 text-sm">CTR Médio</h3>
            <div className="flex items-center mt-2 text-xs text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              +0.8% vs semana
            </div>
          </motion.div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              Sistema IA
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">OLLAMA Status</span>
                <span className={cn("text-sm font-medium", getStatusColor(metrics.ollamaStatus))}>
                  {metrics.ollamaStatus.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Agentes Ativos</span>
                <span className="text-white font-medium">{metrics.activeAgents}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Fila de Processamento</span>
                <span className="text-white font-medium">{metrics.queueSize}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Taxa de Sucesso</span>
                <span className="text-green-400 font-medium">{metrics.successRate}%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-6 lg:col-span-2"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Próximas Publicações
            </h3>
            
            <div className="space-y-3">
              {scheduledPosts.slice(0, 4).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-surface/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs px-2 py-1 rounded", getStatusColor(post.status))}>
                        {post.status}
                      </span>
                      <span className="text-xs text-gray-400">{post.type}</span>
                      <span className={cn("text-xs", getSpamRiskColor(post.spamRisk))}>
                        Risk: {post.spamRisk}
                      </span>
                    </div>
                    <p className="text-white text-sm truncate">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(post.scheduledTime)}</span>
                      <span>•</span>
                      <span>{post.group}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="text-blue-400 hover:text-blue-300">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-yellow-400 hover:text-yellow-300">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {scheduledPosts.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma publicação agendada</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="premium-button px-4 py-3 flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Iniciar Scheduler
            </button>
            
            <button className="premium-button px-4 py-3 flex items-center justify-center gap-2">
              <Pause className="w-4 h-4" />
              Pausar Publicações
            </button>
            
            <button className="premium-button px-4 py-3 flex items-center justify-center gap-2">
              <MousePointer className="w-4 h-4" />
              Testar Publisher
            </button>
            
            <button className="premium-button px-4 py-3 flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ver Analytics
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
