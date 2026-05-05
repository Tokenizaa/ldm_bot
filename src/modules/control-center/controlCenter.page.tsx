import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  Calendar, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  Eye,
  Zap,
  Target,
  BarChart3,
  Clock,
  Shield,
  Cpu,
  Globe,
  Database,
  Filter,
  Search,
  Bell,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIOrchestratorEngine } from '../ai-orchestrator/orchestrator.engine';
import { DecisionMaker } from '../ai-orchestrator/decisionMaker';
import { StrategyEngine } from '../ai-orchestrator/strategyEngine';

export const ControlCenter = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'calendar' | 'analytics' | 'settings'>('overview');
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>({});
  const [autonomousActions, setAutonomousActions] = useState<any[]>([]);
  const [aiDecisions, setAiDecisions] = useState<any[]>([]);

  // Inicializar engines
  const [orchestrator] = useState(() => new AIOrchestratorEngine());
  const [decisionMaker] = useState(() => new DecisionMaker());
  const [strategyEngine] = useState(() => new StrategyEngine());

  useEffect(() => {
    // Simular eventos em tempo real
    const eventTypes = [
      { type: 'crawler', message: 'Crawler analisando nova categoria...', icon: Globe, color: 'text-blue-500' },
      { type: 'ai_analysis', message: 'IA analisando prioridade de produtos...', icon: Brain, color: 'text-purple-500' },
      { type: 'post_generated', message: 'Copy gerada automaticamente', icon: MessageSquare, color: 'text-green-500' },
      { type: 'spam_check', message: 'Validação anti-spam concluída', icon: Shield, color: 'text-orange-500' },
      { type: 'scheduled', message: 'Post agendado para 14:30', icon: Calendar, color: 'text-indigo-500' },
      { type: 'published', message: 'Post publicado com sucesso', icon: CheckCircle2, color: 'text-green-500' },
      { type: 'cooldown', message: 'Grupo XYZ em cooldown 30min', icon: Clock, color: 'text-yellow-500' },
      { type: 'ollama_status', message: 'OLLAMA models operational', icon: Cpu, color: 'text-cyan-500' }
    ];

    const interval = setInterval(() => {
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        ...randomEvent
      };
      
      setLiveEvents(prev => [newEvent, ...prev].slice(0, 15));
    }, 3000);

    // Simular métricas do sistema
    const metricsInterval = setInterval(() => {
      setSystemMetrics({
        posts_today: Math.floor(Math.random() * 8) + 2,
        spam_score: Math.floor(Math.random() * 30) + 10,
        avg_ctr: (Math.random() * 4 + 2).toFixed(1),
        active_groups: Math.floor(Math.random() * 15) + 10,
        queue_size: Math.floor(Math.random() * 25) + 5,
        ai_confidence: Math.floor(Math.random() * 20) + 75,
        system_health: Math.floor(Math.random() * 10) + 90,
        last_update: new Date().toLocaleTimeString('pt-BR')
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(metricsInterval);
    };
  }, []);

  useEffect(() => {
    // Simular ações autônomas da IA
    const actionsInterval = setInterval(() => {
      const actions = [
        { type: 'priority_analysis', product: 'Furadeira Bosch GSB 18V', confidence: 92, status: 'pending' },
        { type: 'content_generation', product: 'Kit Makita 18V', confidence: 87, status: 'approved' },
        { type: 'timing_optimization', product: 'Parafusadeira DeWalt', confidence: 78, status: 'executed' },
        { type: 'spam_prevention', product: 'Serra Circular', confidence: 95, status: 'approved' }
      ];

      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      randomAction.id = Date.now();
      randomAction.timestamp = new Date().toLocaleTimeString('pt-BR');

      setAutonomousActions(prev => [randomAction, ...prev].slice(0, 10));
    }, 8000);

    return () => clearInterval(actionsInterval);
  }, []);

  const handleSystemToggle = () => {
    setIsSystemActive(!isSystemActive);
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Implementar ações rápidas
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-sm font-bold uppercase tracking-wider">
                System Operational
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
              AI CONTROL CENTER
            </h1>
            <p className="text-gray-400 text-lg">
              Autonomous Media Operating System // ForgeDeals AI
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Status Toggle */}
            <button
              onClick={handleSystemToggle}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all ${
                isSystemActive 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-500' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-500'
              }`}
            >
              {isSystemActive ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isSystemActive ? 'System Active' : 'System Paused'}
            </button>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleQuickAction('analyze')}
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                title="Analisar Produtos"
              >
                <Brain className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleQuickAction('generate')}
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                title="Gerar Conteúdo"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleQuickAction('schedule')}
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                title="Agendar Publicação"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleQuickAction('optimize')}
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                title="Otimizar Sistema"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 bg-white/5 p-1 rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'kanban', label: 'Pipeline', icon: BarChart3 },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <MetricCard 
                label="Posts Hoje" 
                value={systemMetrics.posts_today || 0}
                icon={MessageSquare}
                trend="up"
                color="text-green-500"
              />
              <MetricCard 
                label="Spam Score" 
                value={`${systemMetrics.spam_score || 0}%`}
                icon={Shield}
                trend={systemMetrics.spam_score > 25 ? "up" : "down"}
                color={systemMetrics.spam_score > 25 ? "text-red-500" : "text-green-500"}
              />
              <MetricCard 
                label="CTR Médio" 
                value={`${systemMetrics.avg_ctr || 0}%`}
                icon={Eye}
                trend="up"
                color="text-blue-500"
              />
              <MetricCard 
                label="Grupos Ativos" 
                value={systemMetrics.active_groups || 0}
                icon={Users}
                trend="stable"
                color="text-purple-500"
              />
              <MetricCard 
                label="Fila" 
                value={systemMetrics.queue_size || 0}
                icon={Clock}
                trend="down"
                color="text-orange-500"
              />
              <MetricCard 
                label="Confiança IA" 
                value={`${systemMetrics.ai_confidence || 0}%`}
                icon={Brain}
                trend="up"
                color="text-cyan-500"
              />
              <MetricCard 
                label="Saúde Sistema" 
                value={`${systemMetrics.system_health || 0}%`}
                icon={Activity}
                trend="stable"
                color="text-green-500"
              />
              <MetricCard 
                label="Última Atualização" 
                value={systemMetrics.last_update || '--:--'}
                icon={Clock}
                trend="stable"
                color="text-gray-500"
              />
            </div>

            {/* Live Events Stream & AI Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Events Stream */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Live Event Stream
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>REALTIME</span>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {liveEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-white/5"
                      >
                        <event.icon className={`w-4 h-4 mt-0.5 ${event.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-mono">{event.timestamp}</span>
                            <span className="text-xs text-gray-600 uppercase tracking-wider">{event.type}</span>
                          </div>
                          <p className="text-sm text-gray-300 truncate">{event.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* AI Autonomous Actions */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    AI Autonomous Actions
                  </h2>
                  <span className="text-xs text-gray-500">Last 24h</span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {autonomousActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          action.status === 'executed' ? 'bg-green-500' :
                          action.status === 'approved' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-white">{action.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{action.product}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-accent">{action.confidence}%</p>
                        <p className="text-xs text-gray-600">{action.timestamp}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SystemStatusCard
                title="OLLAMA Models"
                status="operational"
                details={["llama3: active", "deepseek: active", "mistral: active", "phi: active"]}
                icon={Cpu}
                color="text-green-500"
              />
              <SystemStatusCard
                title="Anti-Spam Engine"
                status="monitoring"
                details={["Risk score: 22%", "Cooldowns: 3 active", "Warnings: 0", "Safety: high"]}
                icon={Shield}
                color="text-orange-500"
              />
              <SystemStatusCard
                title="Publication Queue"
                status="processing"
                details={["Queue: 12 items", "In progress: 3", "Scheduled: 8", "Failed: 1"]}
                icon={Clock}
                color="text-blue-500"
              />
            </div>
          </div>
        )}

        {/* Other tabs - placeholder */}
        {activeTab !== 'overview' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                {activeTab === 'kanban' && <BarChart3 className="w-8 h-8 text-gray-500" />}
                {activeTab === 'calendar' && <Calendar className="w-8 h-8 text-gray-500" />}
                {activeTab === 'analytics' && <TrendingUp className="w-8 h-8 text-gray-500" />}
                {activeTab === 'settings' && <Settings className="w-8 h-8 text-gray-500" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 capitalize">
                {activeTab} Module
              </h3>
              <p className="text-gray-400">
                Advanced {activeTab} features coming soon in the next update.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Componentes auxiliares
const MetricCard = ({ label, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      {trend && (
        <span className={`text-xs ${
          trend === 'up' ? 'text-green-500' : 
          trend === 'down' ? 'text-red-500' : 
          'text-gray-500'
        }`}>
          {trend === 'up' && <ArrowUpRight className="w-3 h-3 inline" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3 inline" />}
          {trend === 'stable' && <Minus className="w-3 h-3 inline" />}
        </span>
      )}
    </div>
  </div>
);

const SystemStatusCard = ({ title, status, details, icon: Icon, color }: any) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-white flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        {title}
      </h3>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
        status === 'operational' ? 'bg-green-500/20 text-green-500' :
        status === 'monitoring' ? 'bg-orange-500/20 text-orange-500' :
        'bg-blue-500/20 text-blue-500'
      }`}>
        {status}
      </span>
    </div>
    <div className="space-y-2">
      {details.map((detail: string, index: number) => (
        <div key={index} className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{detail.split(':')[0]}</span>
          <span className="text-gray-300 font-mono">{detail.split(':')[1]}</span>
        </div>
      ))}
    </div>
  </div>
);
