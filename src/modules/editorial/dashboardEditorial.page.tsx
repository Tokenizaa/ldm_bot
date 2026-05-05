import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Settings,
  Zap,
  Video,
  MessageSquare,
  Tag,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Activity,
  FileText,
  Image,
  Music,
  Mic,
  Camera,
  Share2,
  Download,
  Upload,
  Save,
  X,
  Info,
  Bell,
  Shield,
  Brain,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Importar engines (simulados para este exemplo)
import { DailyPlanner, DailyEditorialPlan, DailyPost } from './dailyPlanner';
import { InteractionEngine, InteractionContent } from './interactionEngine';
import { PromotionEngine, PromotionContent } from './promotionEngine';
import { VideoEngine, VideoContent } from './videoEngine';
import { PersonaSelector, Persona } from './personaSelector';
import { PublicationScheduler, ScheduledPost } from './publicationScheduler';

export const EditorialDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'planner' | 'content' | 'scheduler' | 'analytics'>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyPlan, setDailyPlan] = useState<DailyEditorialPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Simular instâncias dos engines
  const [dailyPlanner] = useState(new DailyPlanner());
  const [interactionEngine] = useState(new InteractionEngine());
  const [promotionEngine] = useState(new PromotionEngine());
  const [videoEngine] = useState(new VideoEngine());
  const [personaSelector] = useState(new PersonaSelector());
  const [publicationScheduler] = useState(new PublicationScheduler());

  // Estado para diferentes conteúdos
  const [interactions, setInteractions] = useState<InteractionContent[]>([]);
  const [promotions, setPromotions] = useState<PromotionContent[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  // Métricas
  const [metrics, setMetrics] = useState({
    todayPosts: 0,
    readyPosts: 0,
    publishedPosts: 0,
    engagementRate: 0,
    ctrRate: 0,
    spamScore: 0,
    queueLength: 0,
    conflicts: 0
  });

  useEffect(() => {
    loadDailyPlan();
    loadMetrics();
    loadContent();
  }, [selectedDate]);

  const loadDailyPlan = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento do plano diário
      const plan = await dailyPlanner.generateDailyPlan(
        selectedDate,
        [], // Produtos simulados
        {} // Performance simulada
      );
      setDailyPlan(plan);
    } catch (error) {
      console.error('Error loading daily plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = () => {
    // Simular métricas
    setMetrics({
      todayPosts: dailyPlan?.posts.length || 4,
      readyPosts: 3,
      publishedPosts: 1,
      engagementRate: 78,
      ctrRate: 4.2,
      spamScore: 18,
      queueLength: 2,
      conflicts: 0
    });
  };

  const loadContent = () => {
    // Simular carregamento de conteúdo
    setInteractions(interactionEngine.getRecentInteractions(5));
    setPromotions(promotionEngine.getPromotionStats());
    setVideos(videoEngine.getRecentVideos(5));
    setScheduledPosts(Array.from(publicationScheduler.exportSchedulerData().scheduledPosts.values()));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-400">Hoje</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics.todayPosts}</div>
          <div className="text-sm text-gray-400">Posts Programados</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-400">Status</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics.readyPosts}</div>
          <div className="text-sm text-gray-400">Prontos para Publicar</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-400">Performance</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics.engagementRate}%</div>
          <div className="text-sm text-gray-400">Taxa de Engajamento</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-400">Safety</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics.spamScore}</div>
          <div className="text-sm text-gray-400">Spam Score</div>
        </div>
      </div>

      {/* Daily Plan Overview */}
      {dailyPlan && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Plano Editorial - {selectedDate}
          </h3>

          <div className="space-y-3">
            {dailyPlan.posts.map((post, index) => (
              <div key={post.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-sm font-bold text-accent">
                      {post.position}
                    </div>
                    <div>
                      <div className="font-medium text-white">{getPostTypeLabel(post.type)}</div>
                      <div className="text-sm text-gray-400">{post.time_window.optimal_hour}:00 - {post.persona}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs ${
                      post.status === 'published' ? 'bg-green-500/20 text-green-500' :
                      post.status === 'ready' ? 'bg-blue-500/20 text-blue-500' :
                      post.status === 'planned' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {post.status}
                    </div>
                    <div className="text-sm text-gray-400">
                      {post.engagement_prediction}% engajamento
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <Play className="w-4 h-4 text-green-500" />
            <span className="text-sm">Iniciar Auto</span>
          </button>
          <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Recarregar</span>
          </button>
          <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm">Configurar</span>
          </button>
          <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <Download className="w-4 h-4 text-purple-500" />
            <span className="text-sm">Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlanner = () => (
    <div className="space-y-6">
      {/* Planner Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            Planejamento Editorial IA
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoMode(!autoMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                autoMode ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {autoMode ? 'Modo Auto' : 'Modo Manual'}
            </button>
            <button
              onClick={loadDailyPlan}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar Plano
            </button>
          </div>
        </div>

        {/* Strategy Info */}
        {dailyPlan && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Estratégia</div>
              <div className="font-medium text-white capitalize">{dailyPlan.strategy}</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Confiança IA</div>
              <div className="font-medium text-white">{dailyPlan.overall_confidence}%</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Risco Geral</div>
              <div className="font-medium text-white">
                {dailyPlan.risk_assessment.spam_score + dailyPlan.risk_assessment.saturation_score / 2}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Details */}
      {dailyPlan && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="font-bold text-white mb-4">Posts Detalhados</h4>
          <div className="space-y-4">
            {dailyPlan.posts.map((post) => (
              <div key={post.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-medium">
                        {getPostTypeLabel(post.type)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {post.time_window.optimal_hour}:00 - {post.time_window.start_hour}h às {post.time_window.end_hour}h
                      </span>
                    </div>
                    <div className="text-white mb-2">{post.content.text}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Persona: {post.persona}</span>
                      <span>Target: {post.target_groups.length} grupos</span>
                      <span>CTA: {post.content.cta}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Engajamento</div>
                      <div className="font-medium text-white">{post.engagement_prediction}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Spam Risk</div>
                      <div className="font-medium text-white">{post.spam_score}%</div>
                    </div>
                  </div>
                </div>
                {post.content.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.content.hashtags.map((tag, index) => (
                      <span key={index} className="text-xs text-blue-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {/* Content Tabs */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
        {[
          { id: 'interactions', label: 'Interações', icon: MessageSquare },
          { id: 'promotions', label: 'Promoções', icon: Tag },
          { id: 'videos', label: 'Vídeos', icon: Video }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Display */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        {activeTab === 'interactions' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white mb-4">Interações Geradas</h3>
            {interactions.map((interaction) => (
              <div key={interaction.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">
                    {interaction.type}
                  </span>
                  <span className="text-sm text-gray-400">{interaction.persona}</span>
                </div>
                <div className="text-white mb-2">{interaction.content}</div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Engajamento: {interaction.engagement_prediction}%</span>
                  <span>Spam: {interaction.spam_score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white mb-4">Promoções Criadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(promotions) ? promotions.slice(0, 4).map((promo: any, index) => (
                <div key={index} className="bg-black/40 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs">
                      {promo.type || 'standard'}
                    </span>
                    <span className="text-sm text-gray-400">{promo.discount_percentage}% OFF</span>
                  </div>
                  <div className="text-white mb-2">{promo.title}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>CTR: {promo.ctr_prediction}%</span>
                    <span>Conversão: {promo.conversion_prediction}%</span>
                  </div>
                </div>
              )) : null}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white mb-4">Vídeos Produzidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs">
                      {video.type}
                    </span>
                    <span className="text-sm text-gray-400">{video.duration}s</span>
                  </div>
                  <div className="text-white mb-2">{video.title}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Engajamento: {video.engagement_prediction}%</span>
                    <span>Brand: {video.brand_alignment}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderScheduler = () => (
    <div className="space-y-6">
      {/* Scheduler Status */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Agendador de Publicação
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all">
            <Play className="w-4 h-4" />
            Iniciar Processamento
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-white/10 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Agendados</div>
            <div className="font-medium text-white">{metrics.todayPosts}</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Prontos</div>
            <div className="font-medium text-white">{metrics.readyPosts}</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Publicados</div>
            <div className="font-medium text-white">{metrics.publishedPosts}</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Conflitos</div>
            <div className="font-medium text-white">{metrics.conflicts}</div>
          </div>
        </div>
      </div>

      {/* Scheduled Posts */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Posts Agendados</h4>
        <div className="space-y-3">
          {scheduledPosts.map((post) => (
            <div key={post.id} className="bg-black/40 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{post.id}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(post.scheduled_time).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    post.status === 'published' ? 'bg-green-500/20 text-green-500' :
                    post.status === 'ready' ? 'bg-blue-500/20 text-blue-500' :
                    post.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-sm text-gray-400">
                    Priority: {post.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          Analytics Editorial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Engajamento Médio</div>
            <div className="text-2xl font-bold text-white">{metrics.engagementRate}%</div>
            <div className="text-xs text-green-500">+5% vs semana passada</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">CTR Médio</div>
            <div className="text-2xl font-bold text-white">{metrics.ctrRate}%</div>
            <div className="text-xs text-green-500">+0.8% vs semana passada</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Taxa de Spam</div>
            <div className="text-2xl font-bold text-white">{metrics.spamScore}</div>
            <div className="text-xs text-yellow-500">Estável</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Posts Publicados</div>
            <div className="text-2xl font-bold text-white">{metrics.publishedPosts}</div>
            <div className="text-xs text-blue-500">Hoje</div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Performance por Tipo</h4>
        <div className="space-y-4">
          {[
            { type: 'Interações', engagement: 85, ctr: 2.1, color: 'blue' },
            { type: 'Promoções', engagement: 72, ctr: 5.8, color: 'green' },
            { type: 'Vídeos', engagement: 90, ctr: 3.2, color: 'purple' },
            { type: 'Branding', engagement: 65, ctr: 1.5, color: 'yellow' }
          ].map((item) => (
            <div key={item.type} className="bg-black/40 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{item.type}</span>
                <span className="text-sm text-gray-400">Últimos 7 dias</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-24">Engajamento:</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full bg-${item.color}-500`}
                      style={{ width: `${item.engagement}%` }}
                    />
                  </div>
                  <span className="text-sm text-white">{item.engagement}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-24">CTR:</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full bg-${item.color}-500`}
                      style={{ width: `${item.ctr * 10}%` }}
                    />
                  </div>
                  <span className="text-sm text-white">{item.ctr}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getPostTypeLabel = (type: string): string => {
    const labels = {
      'interaction': 'Interação',
      'promotion': 'Promoção',
      'video_branding': 'Vídeo Branding',
      'promotion_premium': 'Promoção Premium'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard Editorial</h1>
          <p className="text-gray-400">Sistema autônomo de gestão editorial com IA</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white outline-none"
            />
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 mb-6">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Activity },
          { id: 'planner', label: 'Planejador IA', icon: Brain },
          { id: 'content', label: 'Conteúdo', icon: FileText },
          { id: 'scheduler', label: 'Agendador', icon: Clock },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'planner' && renderPlanner()}
            {activeTab === 'content' && renderContent()}
            {activeTab === 'scheduler' && renderScheduler()}
            {activeTab === 'analytics' && renderAnalytics()}
          </>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Configurações Editoriais</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Modo Automático</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Quando ativado, a IA gera e agenda posts automaticamente
                  </p>
                  <button
                    onClick={() => setAutoMode(!autoMode)}
                    className={`w-full px-4 py-2 rounded-lg transition-all ${
                      autoMode ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {autoMode ? 'Modo Auto Ativado' : 'Modo Manual'}
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Configurações de Publicação</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input type="checkbox" defaultChecked />
                      <span>Aprovação automática</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input type="checkbox" defaultChecked />
                      <span>Validação de compliance</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input type="checkbox" defaultChecked />
                      <span>Relatórios automáticos</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
