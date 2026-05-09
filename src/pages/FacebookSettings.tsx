import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  Settings, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Zap,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface FacebookConfig {
  posts_per_day: number;
  min_delay_minutes: number;
  max_delay_minutes: number;
  preferred_hours: number[];
  content_distribution: {
    engagement: number;
    educational: number;
    promotion: number;
    institutional: number;
  };
  randomization_enabled: boolean;
  behavior_settings: {
    mouse_movement: boolean;
    typing_simulation: boolean;
    viewport_rotation: boolean;
    human_like_pacing: boolean;
  };
  safety_settings: {
    max_daily_posts: number;
    max_hourly_posts: number;
    cooldown_after_rejection: number;
    auto_pause_on_risk: boolean;
  };
}

export const FacebookSettings = () => {
  const [config, setConfig] = useState<FacebookConfig>({
    posts_per_day: 4,
    min_delay_minutes: 120,
    max_delay_minutes: 240,
    preferred_hours: [9, 13, 17, 20],
    content_distribution: {
      engagement: 40,
      educational: 30,
      promotion: 20,
      institutional: 10
    },
    randomization_enabled: true,
    behavior_settings: {
      mouse_movement: true,
      typing_simulation: true,
      viewport_rotation: false,
      human_like_pacing: true
    },
    safety_settings: {
      max_daily_posts: 10,
      max_hourly_posts: 2,
      cooldown_after_rejection: 60,
      auto_pause_on_risk: true
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      // Mock API call - replace with real Supabase call
      const mockConfig: FacebookConfig = {
        posts_per_day: 4,
        min_delay_minutes: 120,
        max_delay_minutes: 240,
        preferred_hours: [9, 13, 17, 20],
        content_distribution: {
          engagement: 40,
          educational: 30,
          promotion: 20,
          institutional: 10
        },
        randomization_enabled: true,
        behavior_settings: {
          mouse_movement: true,
          typing_simulation: true,
          viewport_rotation: false,
          human_like_pacing: true
        },
        safety_settings: {
          max_daily_posts: 10,
          max_hourly_posts: 2,
          cooldown_after_rejection: 60,
          auto_pause_on_risk: true
        }
      };
      setConfig(mockConfig);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading Facebook config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      // Mock API call - replace with real Supabase call
      console.log('Saving Facebook config:', config);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error saving Facebook config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<FacebookConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateContentDistribution = (type: keyof FacebookConfig['content_distribution'], value: number) => {
    const total = Object.values(config.content_distribution).reduce((sum, val) => sum + val, 0);
    const otherTotal = total - config.content_distribution[type];
    
    if (value + otherTotal === 100) {
      setConfig(prev => ({
        ...prev,
        content_distribution: {
          ...prev.content_distribution,
          [type]: value
        }
      }));
      setHasChanges(true);
    }
  };

  const getDistributionTotal = () => {
    return Object.values(config.content_distribution).reduce((sum, val) => sum + val, 0);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded-lg" />
          <div className="h-96 bg-surface rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Facebook Settings</h1>
          <p className="text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={loadConfig}
            className="premium-button px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Resetar
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
      </div>

      {/* Frequency Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          Frequência de Postagem
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Posts por Dia</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.posts_per_day}
              onChange={(e) => updateConfig({ posts_per_day: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Delay Mínimo (min)</label>
            <input
              type="number"
              min="30"
              max="480"
              value={config.min_delay_minutes}
              onChange={(e) => updateConfig({ min_delay_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Delay Máximo (min)</label>
            <input
              type="number"
              min="60"
              max="720"
              value={config.max_delay_minutes}
              onChange={(e) => updateConfig({ max_delay_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Randomização</label>
            <button
              onClick={() => updateConfig({ randomization_enabled: !config.randomization_enabled })}
              className={cn(
                "w-full px-3 py-2 rounded-lg font-medium transition-colors",
                config.randomization_enabled
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-gray-400"
              )}
            >
              {config.randomization_enabled ? 'Ativada' : 'Desativada'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preferred Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          Horários Preferenciais
        </h3>
        
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {hours.map((hour) => (
            <button
              key={hour}
              onClick={() => {
                const newHours = config.preferred_hours.includes(hour)
                  ? config.preferred_hours.filter(h => h !== hour)
                  : [...config.preferred_hours, hour].sort();
                updateConfig({ preferred_hours: newHours });
              }}
              className={cn(
                "p-2 rounded-lg text-sm font-medium transition-colors",
                config.preferred_hours.includes(hour)
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-gray-400"
              )}
            >
              {hour.toString().padStart(2, '0')}h
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          {config.preferred_hours.length} horários selecionados • 
          Intervalo médio: {config.preferred_hours.length > 1 
            ? Math.round(24 / config.preferred_hours.length) 
            : 24}h
        </div>
      </motion.div>

      {/* Content Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Distribuição de Conteúdo
        </h3>
        
        <div className="space-y-4">
          {Object.entries(config.content_distribution).map(([type, value]) => (
            <div key={type} className="flex items-center gap-4">
              <div className="w-32">
                <span className="text-sm font-medium text-white capitalize">
                  {type === 'engagement' ? 'Engajamento' :
                   type === 'educational' ? 'Educacional' :
                   type === 'promotion' ? 'Promoção' : 'Institucional'}
                </span>
              </div>
              
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => updateContentDistribution(type as keyof FacebookConfig['content_distribution'], parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="w-16 text-right">
                <span className="text-sm font-bold text-white">{value}%</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className={cn(
          "mt-4 p-3 rounded-lg border",
          getDistributionTotal() === 100 
            ? "bg-green-500/20 border-green-500/30 text-green-400"
            : "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
        )}>
          <div className="flex items-center gap-2">
            {getDistributionTotal() === 100 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              Total: {getDistributionTotal()}%
              {getDistributionTotal() !== 100 && ' (deve ser 100%)'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Behavior Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Comportamento Humanizado
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(config.behavior_settings).map(([setting, enabled]) => (
            <button
              key={setting}
              onClick={() => updateConfig({
                behavior_settings: {
                  ...config.behavior_settings,
                  [setting]: !enabled
                }
              })}
              className={cn(
                "p-4 rounded-lg border transition-colors",
                enabled
                  ? "bg-accent/20 border-accent/30 text-accent"
                  : "bg-surface border-border text-gray-400"
              )}
            >
              <div className="text-sm font-medium">
                {setting === 'mouse_movement' ? 'Movimento Mouse' :
                 setting === 'typing_simulation' ? 'Simulação Digitação' :
                 setting === 'viewport_rotation' ? 'Rotação Viewport' : 'Pacing Humano'}
              </div>
              <div className="text-xs mt-1">
                {enabled ? 'Ativado' : 'Desativado'}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Safety Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          Configurações de Segurança
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Máximo Diário</label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.safety_settings.max_daily_posts}
                onChange={(e) => updateConfig({
                  safety_settings: {
                    ...config.safety_settings,
                    max_daily_posts: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Máximo por Hora</label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.safety_settings.max_hourly_posts}
                onChange={(e) => updateConfig({
                  safety_settings: {
                    ...config.safety_settings,
                    max_hourly_posts: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Cooldown Após Rejeição (min)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={config.safety_settings.cooldown_after_rejection}
                onChange={(e) => updateConfig({
                  safety_settings: {
                    ...config.safety_settings,
                    cooldown_after_rejection: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Pausa Automática</label>
              <button
                onClick={() => updateConfig({
                  safety_settings: {
                    ...config.safety_settings,
                    auto_pause_on_risk: !config.safety_settings.auto_pause_on_risk
                  }
                })}
                className={cn(
                  "w-full px-3 py-2 rounded-lg font-medium transition-colors",
                  config.safety_settings.auto_pause_on_risk
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-gray-400"
                )}
              >
                {config.safety_settings.auto_pause_on_risk ? 'Ativada' : 'Desativada'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          Ações Rápidas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
            <Play className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Iniciar Bot</div>
          </button>
          
          <button className="p-4 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors">
            <Pause className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Pausar Bot</div>
          </button>
          
          <button className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
            <XCircle className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Modo Seguro</div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
