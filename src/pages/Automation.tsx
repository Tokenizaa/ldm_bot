import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Settings, 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Save,
  Clock,
  Activity,
  Target,
  Ban,
  Power,
  Gauge,
  Timer,
  Lock,
  Unlock,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AutomationConfig {
  bot_enabled: boolean;
  safe_mode: boolean;
  aggressive_mode: boolean;
  daily_limit: number;
  auto_retry_failed: boolean;
  max_retries: number;
  delays: {
    min_delay_minutes: number;
    max_delay_minutes: number;
    randomization_enabled: boolean;
    human_like_pacing: boolean;
  };
  safety: {
    max_hourly_posts: number;
    auto_pause_on_risk: boolean;
    cooldown_after_rejection: number;
    monitor_account_health: boolean;
  };
  performance: {
    concurrent_processing: boolean;
    max_concurrent_tasks: number;
    memory_limit_mb: number;
    cleanup_interval_minutes: number;
  };
}

export const Automation = () => {
  const [config, setConfig] = useState<AutomationConfig>({
    bot_enabled: true,
    safe_mode: false,
    aggressive_mode: false,
    daily_limit: 10,
    auto_retry_failed: true,
    max_retries: 3,
    delays: {
      min_delay_minutes: 120,
      max_delay_minutes: 240,
      randomization_enabled: true,
      human_like_pacing: true
    },
    safety: {
      max_hourly_posts: 2,
      auto_pause_on_risk: true,
      cooldown_after_rejection: 60,
      monitor_account_health: true
    },
    performance: {
      concurrent_processing: false,
      max_concurrent_tasks: 3,
      memory_limit_mb: 2048,
      cleanup_interval_minutes: 30
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock system status
  const [systemStatus, setSystemStatus] = useState({
    bot_running: true,
    current_mode: 'normal' as 'safe' | 'normal' | 'aggressive',
    posts_today: 7,
    posts_remaining: 3,
    next_post_in: '45 minutos',
    system_health: 'good' as 'good' | 'warning' | 'critical',
    active_tasks: 2,
    queued_tasks: 5,
    memory_usage: 1247,
    cpu_usage: 23
  });

  useEffect(() => {
    loadConfig();
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        next_post_in: Math.max(1, parseInt(prev.next_post_in) - 1) + ' minutos',
        memory_usage: prev.memory_usage + Math.floor(Math.random() * 20) - 10
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      // Mock API call - replace with real Supabase call
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading automation config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      // Mock API call - replace with real Supabase call
      console.log('Saving automation config:', config);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error saving automation config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<AutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const startBot = async () => {
    try {
      console.log('Starting bot...');
      setSystemStatus(prev => ({ ...prev, bot_running: true }));
      updateConfig({ bot_enabled: true });
    } catch (error) {
      console.error('Error starting bot:', error);
    }
  };

  const stopBot = async () => {
    try {
      console.log('Stopping bot...');
      setSystemStatus(prev => ({ ...prev, bot_running: false }));
      updateConfig({ bot_enabled: false });
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  };

  const toggleSafeMode = () => {
    const newSafeMode = !config.safe_mode;
    updateConfig({ 
      safe_mode: newSafeMode,
      aggressive_mode: false 
    });
    setSystemStatus(prev => ({ 
      ...prev, 
      current_mode: newSafeMode ? 'safe' : 'normal' 
    }));
  };

  const toggleAggressiveMode = () => {
    const newAggressiveMode = !config.aggressive_mode;
    updateConfig({ 
      aggressive_mode: newAggressiveMode,
      safe_mode: false 
    });
    setSystemStatus(prev => ({ 
      ...prev, 
      current_mode: newAggressiveMode ? 'aggressive' : 'normal' 
    }));
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)] pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="text-accent w-8 h-8" />
            Central de Automação
          </h2>
          <p className="text-gray-400 mt-1">Controle completo do bot, modos de segurança e performance</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadConfig}
            className="premium-button px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving || !hasChanges}
            className={cn(
              "premium-button px-4 py-2 flex items-center gap-2",
              (!hasChanges || isSaving) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={cn(
          "premium-card p-4 border-2",
          systemStatus.bot_running ? "border-green-500/30" : "border-red-500/30"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Status Bot</div>
              <div className={cn(
                "text-xl font-bold",
                systemStatus.bot_running ? "text-green-400" : "text-red-400"
              )}>
                {systemStatus.bot_running ? 'Rodando' : 'Parado'}
              </div>
            </div>
            <Power className={cn(
              "w-5 h-5",
              systemStatus.bot_running ? "text-green-400" : "text-red-400"
            )} />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Modo Atual</div>
              <div className={cn(
                "text-xl font-bold capitalize",
                systemStatus.current_mode === 'safe' ? "text-blue-400" :
                systemStatus.current_mode === 'aggressive' ? "text-orange-400" : "text-white"
              )}>
                {systemStatus.current_mode === 'safe' ? 'Seguro' :
                 systemStatus.current_mode === 'aggressive' ? 'Agressivo' : 'Normal'}
              </div>
            </div>
            {systemStatus.current_mode === 'safe' ? (
              <Shield className="w-5 h-5 text-blue-400" />
            ) : systemStatus.current_mode === 'aggressive' ? (
              <Zap className="w-5 h-5 text-orange-400" />
            ) : (
              <Activity className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Posts Hoje</div>
              <div className="text-xl font-bold text-white">
                {systemStatus.posts_today}/{config.daily_limit}
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-accent" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Próximo Post</div>
              <div className="text-xl font-bold text-accent">
                {systemStatus.next_post_in}
              </div>
            </div>
            <Clock className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>

      {/* Bot Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Power className="w-5 h-5 text-accent" />
          Controle do Bot
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={startBot}
            disabled={systemStatus.bot_running}
            className={cn(
              "p-4 rounded-lg border transition-colors flex items-center gap-3",
              systemStatus.bot_running 
                ? "bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed"
                : "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
            )}
          >
            <Play className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Iniciar Bot</div>
              <div className="text-xs opacity-75">Começar automação</div>
            </div>
          </button>
          
          <button
            onClick={stopBot}
            disabled={!systemStatus.bot_running}
            className={cn(
              "p-4 rounded-lg border transition-colors flex items-center gap-3",
              !systemStatus.bot_running 
                ? "bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed"
                : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
            )}
          >
            <Pause className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Parar Bot</div>
              <div className="text-xs opacity-75">Pausar automação</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              console.log('Emergency stop triggered');
              stopBot();
              updateConfig({ bot_enabled: false, safe_mode: true });
            }}
            className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-3"
          >
            <Ban className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Parada Emergencial</div>
              <div className="text-xs opacity-75">Parar tudo</div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Operation Modes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          Modos de Operação
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={toggleSafeMode}
            className={cn(
              "p-4 rounded-lg border transition-colors",
              config.safe_mode
                ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                : "bg-surface border-border text-gray-400 hover:text-white"
            )}
          >
            <Shield className="w-6 h-6 mb-2" />
            <div className="text-sm font-medium">Modo Seguro</div>
            <div className="text-xs opacity-75 mt-1">
              {config.safe_mode ? 'Ativado' : 'Desativado'}
            </div>
            <div className="text-xs opacity-50 mt-2">
              Limites restritivos, delays maiores
            </div>
          </button>
          
          <button
            onClick={() => {
              updateConfig({ safe_mode: false, aggressive_mode: false });
              setSystemStatus(prev => ({ ...prev, current_mode: 'normal' }));
            }}
            className={cn(
              "p-4 rounded-lg border transition-colors",
              !config.safe_mode && !config.aggressive_mode
                ? "bg-accent/20 border-accent/30 text-accent"
                : "bg-surface border-border text-gray-400 hover:text-white"
            )}
          >
            <Activity className="w-6 h-6 mb-2" />
            <div className="text-sm font-medium">Modo Normal</div>
            <div className="text-xs opacity-75 mt-1">
              {!config.safe_mode && !config.aggressive_mode ? 'Ativado' : 'Desativado'}
            </div>
            <div className="text-xs opacity-50 mt-2">
              Balanceamento padrão
            </div>
          </button>
          
          <button
            onClick={toggleAggressiveMode}
            className={cn(
              "p-4 rounded-lg border transition-colors",
              config.aggressive_mode
                ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                : "bg-surface border-border text-gray-400 hover:text-white"
            )}
          >
            <Zap className="w-6 h-6 mb-2" />
            <div className="text-sm font-medium">Modo Agressivo</div>
            <div className="text-xs opacity-75 mt-1">
              {config.aggressive_mode ? 'Ativado' : 'Desativado'}
            </div>
            <div className="text-xs opacity-50 mt-2">
              Frequência máxima, performance alta
            </div>
          </button>
        </div>
      </motion.div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Limits & Delays */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Timer className="w-4 h-4 text-accent" />
            Limites e Delays
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Limite Diário</label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.daily_limit}
                onChange={(e) => updateConfig({ daily_limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Delay Mínimo (min)</label>
                <input
                  type="number"
                  min="10"
                  max="480"
                  value={config.delays.min_delay_minutes}
                  onChange={(e) => updateConfig({ 
                    delays: { ...config.delays, min_delay_minutes: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Delay Máximo (min)</label>
                <input
                  type="number"
                  min="30"
                  max="720"
                  value={config.delays.max_delay_minutes}
                  onChange={(e) => updateConfig({ 
                    delays: { ...config.delays, max_delay_minutes: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => updateConfig({ 
                  delays: { ...config.delays, randomization_enabled: !config.delays.randomization_enabled }
                })}
                className={cn(
                  "w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                  config.delays.randomization_enabled
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-gray-400"
                )}
              >
                {config.delays.randomization_enabled ? (
                  <Unlock className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Randomização: {config.delays.randomization_enabled ? 'Ativada' : 'Desativada'}
              </button>
              
              <button
                onClick={() => updateConfig({ 
                  delays: { ...config.delays, human_like_pacing: !config.delays.human_like_pacing }
                })}
                className={cn(
                  "w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                  config.delays.human_like_pacing
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-gray-400"
                )}
              >
                <Users className="w-4 h-4" />
                Pacing Humano: {config.delays.human_like_pacing ? 'Ativado' : 'Desativado'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Safety Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Configurações de Segurança
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Máximo por Hora</label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.safety.max_hourly_posts}
                onChange={(e) => updateConfig({ 
                  safety: { ...config.safety, max_hourly_posts: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Cooldown Após Rejeição (min)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={config.safety.cooldown_after_rejection}
                onChange={(e) => updateConfig({ 
                  safety: { ...config.safety, cooldown_after_rejection: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => updateConfig({ 
                  safety: { ...config.safety, auto_pause_on_risk: !config.safety.auto_pause_on_risk }
                })}
                className={cn(
                  "w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                  config.safety.auto_pause_on_risk
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-gray-400"
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                Pausa Automática em Risco: {config.safety.auto_pause_on_risk ? 'Ativada' : 'Desativada'}
              </button>
              
              <button
                onClick={() => updateConfig({ 
                  safety: { ...config.safety, monitor_account_health: !config.safety.monitor_account_health }
                })}
                className={cn(
                  "w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                  config.safety.monitor_account_health
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-gray-400"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Monitorar Saúde da Conta: {config.safety.monitor_account_health ? 'Ativado' : 'Desativada'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-accent" />
          Performance e Recursos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Limite de Memória (MB)</label>
              <input
                type="number"
                min="512"
                max="8192"
                step="256"
                value={config.performance.memory_limit_mb}
                onChange={(e) => updateConfig({ 
                  performance: { ...config.performance, memory_limit_mb: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Limpeza Automática (min)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={config.performance.cleanup_interval_minutes}
                onChange={(e) => updateConfig({ 
                  performance: { ...config.performance, cleanup_interval_minutes: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => updateConfig({ 
                performance: { ...config.performance, concurrent_processing: !config.performance.concurrent_processing }
              })}
              className={cn(
                "w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                config.performance.concurrent_processing
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-gray-400"
              )}
            >
              <Activity className="w-4 h-4" />
              Processamento Concorrente: {config.performance.concurrent_processing ? 'Ativado' : 'Desativado'}
            </button>
            
            {config.performance.concurrent_processing && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Máximo de Tasks Concorrentes</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.performance.max_concurrent_tasks}
                  onChange={(e) => updateConfig({ 
                    performance: { ...config.performance, max_concurrent_tasks: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* System Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Métricas do Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-surface rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Tasks Ativos</div>
            <div className="text-2xl font-bold text-white">{systemStatus.active_tasks}</div>
          </div>
          
          <div className="p-4 bg-surface rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Tasks na Fila</div>
            <div className="text-2xl font-bold text-accent">{systemStatus.queued_tasks}</div>
          </div>
          
          <div className="p-4 bg-surface rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Uso de Memória</div>
            <div className="text-2xl font-bold text-white">{systemStatus.memory_usage} MB</div>
            <div className="text-xs text-gray-400 mt-1">
              de {config.performance.memory_limit_mb} MB
            </div>
          </div>
          
          <div className="p-4 bg-surface rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Uso de CPU</div>
            <div className="text-2xl font-bold text-white">{systemStatus.cpu_usage}%</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
