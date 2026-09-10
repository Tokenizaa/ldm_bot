import React, { useState, useEffect, useCallback } from 'react';
import { 
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
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useConfig } from '../context/ConfigContext';
import { api } from '../lib/api';
import type { FacebookConfig as PanelFacebookConfig } from '@forge-deals/shared/types/config';
import { DEFAULT_CONFIG } from '@forge-deals/shared/types/config';

interface FacebookConfig extends PanelFacebookConfig {
  postingFrequency: {
    postsPerDay: number;
    minInterval: number;
    maxInterval: number;
    preferredHours: number[];
  };
  contentDistribution: {
    institutional: number;
    promotional: number;
    interaction: number;
    educational: number;
  };
  humanBehavior: {
    delays: { min: number; max: number };
    typingSpeed: { min: number; max: number };
    mouseMovement: boolean;
    cooldown: number;
    randomization: number;
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

const normalizePriority = (value: unknown): GroupConfig['priority'] => {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
};

export const FacebookControlCenter = () => {
  const { config, update, loading: configLoading } = useConfig();
  const [groups, setGroups] = useState<GroupConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  const [localConfig, setLocalConfig] = useState<FacebookConfig>(() => ({
    ...DEFAULT_CONFIG.facebook,
    postingFrequency: {
      postsPerDay: 10,
      minInterval: 30,
      maxInterval: 120,
      preferredHours: [9, 13, 17, 20]
    },
    contentDistribution: {
      institutional: 10,
      promotional: 40,
      interaction: 30,
      educational: 20
    },
    humanBehavior: {
      delays: { min: 2000, max: 5000 },
      typingSpeed: { min: 40, max: 80 },
      mouseMovement: true,
      cooldown: 15,
      randomization: 75
    },
    ...(config?.facebook ?? {})
  }));

  useEffect(() => {
    if (config?.facebook) {
      setLocalConfig(prev => ({ ...prev, ...config.facebook }));
    }
  }, [config]);

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await api.getGroups();
      if (result.success && result.data) {
        setGroups(result.data.map((g: any): GroupConfig => ({
          id: String(g.id),
          name: typeof g.name === 'string' && g.name.trim() ? g.name : `Grupo ${g.id}`,
          active: Boolean(g.active),
          priority: normalizePriority(g.priority),
          riskScore: typeof g.riskScore === 'number' ? g.riskScore : 25,
          saturationScore: typeof g.saturationScore === 'number' ? g.saturationScore : 40,
          engagementScore: typeof g.engagementScore === 'number' ? g.engagementScore : 70,
          postsToday: typeof g.postsToday === 'number' ? g.postsToday : 0,
          dailyLimit: typeof g.dailyLimit === 'number' ? g.dailyLimit : 5,
          lastPost: g.lastPost ? new Date(g.lastPost) : undefined,
          cooldownUntil: g.cooldownUntil ? new Date(g.cooldownUntil) : undefined
        })));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    const interval = setInterval(loadGroups, 30000);
    return () => clearInterval(interval);
  }, [loadGroups]);

  const updateLocalConfig = (updater: (prev: FacebookConfig) => FacebookConfig) => {
    setLocalConfig(prev => {
      const next = updater(prev);
      update({ facebook: next } as any);
      return next;
    });
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.updateConfig({ facebook: localConfig });
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<GroupConfig>) => {
    setGroups(prev => prev.map(group => group.id === groupId ? { ...group, ...updates } : group));
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

  const getGroupStatus = (group: GroupConfig) => {
    if (!group.active) return { status: 'inactive', color: 'text-gray-400', text: 'Inativo' };
    if (group.cooldownUntil && group.cooldownUntil > new Date()) return { status: 'cooldown', color: 'text-yellow-400', text: 'Cooldown' };
    if (group.postsToday >= group.dailyLimit) return { status: 'limit', color: 'text-red-400', text: 'Limite' };
    return { status: 'active', color: 'text-green-400', text: 'Ativo' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Facebook Control Center</h1>
          <p className="text-gray-400">Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={saveConfig} disabled={saving || isLoading} className="premium-button px-4 py-2 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Config'}
          </button>
          <button onClick={loadGroups} disabled={isLoading} className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Posting Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="premium-card p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-accent" />Frequência de Postagem</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Posts por Dia</label>
              <input type="range" min="1" max="50" value={localConfig.postingFrequency.postsPerDay} onChange={(e) => updateLocalConfig(prev => ({ ...prev, postingFrequency: { ...prev.postingFrequency, postsPerDay: parseInt(e.target.value) } }))} className="w-full" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span className="text-accent font-bold">{localConfig.postingFrequency.postsPerDay}</span><span>50</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-400 mb-2 block">Intervalo Mínimo (min)</label><input type="number" min="5" max="60" value={localConfig.postingFrequency.minInterval} onChange={(e) => updateLocalConfig(prev => ({ ...prev, postingFrequency: { ...prev.postingFrequency, minInterval: parseInt(e.target.value) } }))} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white" /></div>
              <div><label className="text-sm text-gray-400 mb-2 block">Intervalo Máximo (min)</label><input type="number" min="30" max="240" value={localConfig.postingFrequency.maxInterval} onChange={(e) => updateLocalConfig(prev => ({ ...prev, postingFrequency: { ...prev.postingFrequency, maxInterval: parseInt(e.target.value) } }))} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white" /></div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Horários Preferenciais</label>
              <div className="grid grid-cols-4 gap-2">
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(hour => (
                  <button key={hour} onClick={() => { const hours = localConfig.postingFrequency.preferredHours.includes(hour) ? localConfig.postingFrequency.preferredHours.filter(h => h !== hour) : [...localConfig.postingFrequency.preferredHours, hour]; updateLocalConfig(prev => ({ ...prev, postingFrequency: { ...prev.postingFrequency, preferredHours: hours } })); }} className={cn("py-1 px-2 text-xs rounded border transition-colors", localConfig.postingFrequency.preferredHours.includes(hour) ? "bg-accent/20 border-accent text-accent" : "bg-surface/50 border-border text-gray-400 hover:text-white")}>{hour}h</button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Distribution */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="premium-card p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-accent" />Distribuição de Conteúdo</h3>
          <div className="space-y-4">
            {[{ key: 'institutional', label: 'Institucional', color: 'bg-blue-500' }, { key: 'promotional', label: 'Promoção', color: 'bg-green-500' }, { key: 'interaction', label: 'Interação', color: 'bg-purple-500' }, { key: 'educational', label: 'Educativo', color: 'bg-yellow-500' }].map(({ key, label, color }) => (
              <div key={key} className="space-y-2"><div className="flex justify-between items-center"><span className="text-sm text-gray-400">{label}</span><span className="text-sm font-bold text-white">{localConfig.contentDistribution[key as keyof typeof localConfig.contentDistribution]}%</span></div><div className="flex items-center gap-2"><input type="range" min="0" max="100" value={localConfig.contentDistribution[key as keyof typeof localConfig.contentDistribution]} onChange={(e) => updateLocalConfig(prev => ({ ...prev, contentDistribution: { ...prev.contentDistribution, [key]: parseInt(e.target.value) } }))} className="flex-1" /><div className={`w-3 h-3 rounded-full ${color}`} /></div></div>
            ))}
            <div className="pt-4 border-t border-border"><div className="flex justify-between items-center"><span className="text-sm font-semibold text-white">Total</span><span className="text-sm font-bold text-accent">{Object.values(localConfig.contentDistribution).reduce((a, b) => a + b, 0)}%</span></div>{Object.values(localConfig.contentDistribution).reduce((a, b) => a + b, 0) !== 100 && <p className="text-xs text-yellow-400 mt-1">⚠️ A soma deve ser 100%</p>}</div>
          </div>
        </motion.div>
      </div>

      {/* Groups Management */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-accent" />Gerenciamento de Grupos</h3>
        <div className="space-y-4">
          {groups.map((group, index) => {
            const status = getGroupStatus(group);
            return (
              <motion.div key={group.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-4 bg-surface/50 rounded-lg border border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3"><button onClick={() => updateGroup(group.id, { active: !group.active })} className={cn("w-2 h-2 rounded-full transition-colors", group.active ? "bg-green-400" : "bg-gray-500")} /><div><p className="text-sm font-semibold text-white">{group.name}</p><p className={cn("text-xs", status.color)}>{status.text}</p></div></div>
                  <div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xs text-gray-400">Risco</p><p className={cn("text-sm font-bold", getRiskColor(group.riskScore))}>{group.riskScore}%</p></div><div><p className="text-xs text-gray-400">Saturação</p><p className={cn("text-sm font-bold", getRiskColor(group.saturationScore))}>{group.saturationScore}%</p></div><div><p className="text-xs text-gray-400">Engajamento</p><p className="text-sm font-bold text-green-400">{group.engagementScore}%</p></div></div>
                  <div className="flex items-center gap-4"><div className="text-center"><p className="text-xs text-gray-400">Posts Hoje</p><p className="text-sm font-bold text-white">{group.postsToday}/{group.dailyLimit}</p></div><div className="text-center"><p className="text-xs text-gray-400">Prioridade</p><p className={cn("text-sm font-bold", getPriorityColor(group.priority))}>{group.priority.toUpperCase()}</p></div></div>
                  <div className="flex items-center gap-2"><select value={group.priority} onChange={(e) => updateGroup(group.id, { priority: normalizePriority(e.target.value) })} className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
