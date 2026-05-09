import React, { useState, useEffect } from 'react';
import { 
  Facebook, 
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
  Save,
  RefreshCw,
  Sliders,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface FacebookConfig {
  postingFrequency: {
    postsPerDay: number;
    minInterval: number; // minutes
    maxInterval: number; // minutes
    preferredHours: number[];
  };
  contentDistribution: {
    institutional: number; // percentage
    promotional: number;
    interaction: number;
    educational: number;
  };
  humanBehavior: {
    delays: {
      min: number; // ms
      max: number; // ms
    };
    typingSpeed: {
      min: number; // wpm
      max: number; // wpm
    };
    mouseMovement: boolean;
    cooldown: number; // minutes
    randomization: number; // 0-100
  };
}

interface GroupConfig {
  id: string;
  name: string;
  active: boolean;
  priority: 'low' | 'medium' | 'high';
  riskScore: number;
  saturationScore: number;
  engagementScore: number;
  postsToday: number;
  dailyLimit: number;
  cooldownUntil?: Date;
  lastPost?: Date;
}

export const FacebookControlCenter = () => {
  const [config, setConfig] = useState<FacebookConfig>({
    postingFrequency: {
      postsPerDay: 15,
      minInterval: 30,
      maxInterval: 120,
      preferredHours: [9, 13, 17, 20]
    },
    contentDistribution: {
      institutional: 10,
      promotional: 20,
      interaction: 40,
      educational: 30
    },
    humanBehavior: {
      delays: { min: 2000, max: 5000 },
      typingSpeed: { min: 40, max: 80 },
      mouseMovement: true,
      cooldown: 15,
      randomization: 75
    }
  });

  const [groups, setGroups] = useState<GroupConfig[]>([
    {
      id: '1',
      name: 'Ferramentas Profissionais',
      active: true,
      priority: 'high',
      riskScore: 25,
      saturationScore: 60,
      engagementScore: 85,
      postsToday: 3,
      dailyLimit: 5,
      lastPost: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Madeira e Construção',
      active: true,
      priority: 'medium',
      riskScore: 40,
      saturationScore: 45,
      engagementScore: 72,
      postsToday: 2,
      dailyLimit: 4,
      lastPost: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Jardinagem e Paisagismo',
      active: false,
      priority: 'low',
      riskScore: 15,
      saturationScore: 30,
      engagementScore: 65,
      postsToday: 0,
      dailyLimit: 3
    },
    {
      id: '4',
      name: 'Soldagem e Cortes',
      active: true,
      priority: 'medium',
      riskScore: 55,
      saturationScore: 70,
      engagementScore: 58,
      postsToday: 4,
      dailyLimit: 4,
      cooldownUntil: new Date(Date.now() + 6 * 60 * 60 * 1000)
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadConfig();
    loadGroups();
    
    const interval = setInterval(() => {
      loadGroups();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      // Load config from API
      setIsLoading(true);
      // Mock data
      setConfig({
        postingFrequency: {
          postsPerDay: 15,
          minInterval: 30,
          maxInterval: 120,
          preferredHours: [9, 13, 17, 20]
        },
        contentDistribution: {
          institutional: 10,
          promotional: 20,
          interaction: 40,
          educational: 30
        },
        humanBehavior: {
          delays: { min: 2000, max: 5000 },
          typingSpeed: { min: 40, max: 80 },
          mouseMovement: true,
          cooldown: 15,
          randomization: 75
        }
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      // Load groups from API
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setIsLoading(true);
      // Save config to API
      console.log('Saving config:', config);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<GroupConfig>) => {
    try {
      setGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      ));
      // Update group in API
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getGroupStatus = (group: GroupConfig) => {
    if (!group.active) return { status: 'inactive', color: 'text-gray-400', text: 'Inativo' };
    if (group.cooldownUntil && group.cooldownUntil > new Date()) {
      return { status: 'cooldown', color: 'text-yellow-400', text: 'Cooldown' };
    }
    if (group.postsToday >= group.dailyLimit) {
      return { status: 'limit', color: 'text-red-400', text: 'Limite' };
    }
    return { status: 'active', color: 'text-green-400', text: 'Ativo' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Facebook Control Center</h1>
          <p className="text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={saveConfig}
            disabled={isLoading}
            className="premium-button px-4 py-2 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Config'}
          </button>
          <button className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Posting Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Frequência de Postagem
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Posts por Dia</label>
              <input
                type="range"
                min="1"
                max="50"
                value={config.postingFrequency.postsPerDay}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  postingFrequency: {
                    ...prev.postingFrequency,
                    postsPerDay: parseInt(e.target.value)
                  }
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span className="text-accent font-bold">{config.postingFrequency.postsPerDay}</span>
                <span>50</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Intervalo Mínimo (min)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.postingFrequency.minInterval}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    postingFrequency: {
                      ...prev.postingFrequency,
                      minInterval: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Intervalo Máximo (min)</label>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={config.postingFrequency.maxInterval}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    postingFrequency: {
                      ...prev.postingFrequency,
                      maxInterval: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Horários Preferenciais</label>
              <div className="grid grid-cols-4 gap-2">
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(hour => (
                  <button
                    key={hour}
                    onClick={() => {
                      const hours = config.postingFrequency.preferredHours.includes(hour)
                        ? config.postingFrequency.preferredHours.filter(h => h !== hour)
                        : [...config.postingFrequency.preferredHours, hour];
                      setConfig(prev => ({
                        ...prev,
                        postingFrequency: {
                          ...prev.postingFrequency,
                          preferredHours: hours
                        }
                      }));
                    }}
                    className={cn(
                      "py-1 px-2 text-xs rounded border transition-colors",
                      config.postingFrequency.preferredHours.includes(hour)
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-surface/50 border-border text-gray-400 hover:text-white"
                    )}
                  >
                    {hour}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Distribuição de Conteúdo
          </h3>
          
          <div className="space-y-4">
            {[
              { key: 'institutional', label: 'Institucional', color: 'bg-blue-500' },
              { key: 'promotional', label: 'Promoção', color: 'bg-green-500' },
              { key: 'interaction', label: 'Interação', color: 'bg-purple-500' },
              { key: 'educational', label: 'Educativo', color: 'bg-yellow-500' }
            ].map(({ key, label, color }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-bold text-white">
                    {config.contentDistribution[key as keyof typeof config.contentDistribution]}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.contentDistribution[key as keyof typeof config.contentDistribution]}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      contentDistribution: {
                        ...prev.contentDistribution,
                        [key]: parseInt(e.target.value)
                      }
                    }))}
                    className="flex-1"
                  />
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-sm font-bold text-accent">
                  {Object.values(config.contentDistribution).reduce((a, b) => a + b, 0)}%
                </span>
              </div>
              {Object.values(config.contentDistribution).reduce((a, b) => a + b, 0) !== 100 && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ A soma deve ser 100%
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Human Behavior Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <MousePointer className="w-5 h-5 text-accent" />
          Comportamento Humano
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Delays (ms)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mínimo</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={config.humanBehavior.delays.min}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      delays: {
                        ...prev.humanBehavior.delays,
                        min: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Máximo</label>
                <input
                  type="number"
                  min="1000"
                  max="15000"
                  step="500"
                  value={config.humanBehavior.delays.max}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      delays: {
                        ...prev.humanBehavior.delays,
                        max: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Velocidade de Digitação (WPM)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mínimo</label>
                <input
                  type="number"
                  min="20"
                  max="60"
                  value={config.humanBehavior.typingSpeed.min}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      typingSpeed: {
                        ...prev.humanBehavior.typingSpeed,
                        min: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Máximo</label>
                <input
                  type="number"
                  min="40"
                  max="120"
                  value={config.humanBehavior.typingSpeed.max}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      typingSpeed: {
                        ...prev.humanBehavior.typingSpeed,
                        max: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Configurações Adicionais</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Movimento do Mouse</span>
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      mouseMovement: !prev.humanBehavior.mouseMovement
                    }
                  }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors",
                    config.humanBehavior.mouseMovement ? "bg-accent" : "bg-gray-600"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full transition-transform",
                    config.humanBehavior.mouseMovement ? "translate-x-6" : "translate-x-0.5"
                  )} />
                </button>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cooldown (min)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.humanBehavior.cooldown}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      cooldown: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Randomização (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.humanBehavior.randomization}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    humanBehavior: {
                      ...prev.humanBehavior,
                      randomization: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full"
                />
                <div className="text-center text-xs text-accent font-bold">
                  {config.humanBehavior.randomization}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Groups Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          Gerenciamento de Grupos
        </h3>
        
        <div className="space-y-4">
          {groups.map((group, index) => {
            const status = getGroupStatus(group);
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-surface/50 rounded-lg border border-border"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateGroup(group.id, { active: !group.active })}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        group.active ? "bg-green-400" : "bg-gray-500"
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{group.name}</p>
                      <p className={cn("text-xs", status.color)}>{status.text}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Risco</p>
                      <p className={cn("text-sm font-bold", getRiskColor(group.riskScore))}>
                        {group.riskScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Saturação</p>
                      <p className={cn("text-sm font-bold", getRiskColor(group.saturationScore))}>
                        {group.saturationScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Engajamento</p>
                      <p className="text-sm font-bold text-green-400">{group.engagementScore}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Posts Hoje</p>
                      <p className="text-sm font-bold text-white">
                        {group.postsToday}/{group.dailyLimit}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Prioridade</p>
                      <p className={cn("text-sm font-bold", getPriorityColor(group.priority))}>
                        {group.priority.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={group.priority}
                      onChange={(e) => updateGroup(group.id, { 
                        priority: e.target.value as 'low' | 'medium' | 'high' 
                      })}
                      className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                    
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={group.dailyLimit}
                      onChange={(e) => updateGroup(group.id, { 
                        dailyLimit: parseInt(e.target.value) 
                      })}
                      className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-white text-sm text-center"
                      placeholder="Limite"
                    />
                    
                    {group.cooldownUntil && (
                      <div className="text-xs text-yellow-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTime(group.cooldownUntil)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

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
            Pausar Todas
          </button>
          
          <button className="premium-button px-4 py-3 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Modo Seguro
          </button>
          
          <button className="premium-button px-4 py-3 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Testar Config
          </button>
        </div>
      </motion.div>
    </div>
  );
};
