import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Save,
  Settings,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Zap,
  Shield,
  MessageSquare,
  Heart,
  BarChart3,
  Target,
  Ban,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Group {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: number;
  dailyLimit: number;
  cooldownMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
  saturationScore: number;
  allowPromotions: boolean;
  allowAffiliateLinks: boolean;
  status: 'active' | 'paused' | 'blocked' | 'cooldown';
  
  // Metrics
  postsToday: number;
  postsWeek: number;
  avgEngagement: number;
  comments: number;
  reactions: number;
  communityScore: number;
  
  // Timing
  lastPosted?: Date;
  nextAvailable?: Date;
  memberCount: number;
  groupType: 'public' | 'private' | 'marketplace';
  
  // Performance
  successRate: number;
  avgResponseTime: number;
  rejectionCount: number;
}

export const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Ferramentas Profissionais BR',
      url: 'https://facebook.com/groups/123456789',
      enabled: true,
      priority: 9,
      dailyLimit: 3,
      cooldownMinutes: 180,
      riskLevel: 'low',
      saturationScore: 45,
      allowPromotions: true,
      allowAffiliateLinks: true,
      status: 'active',
      postsToday: 2,
      postsWeek: 14,
      avgEngagement: 82,
      comments: 45,
      reactions: 128,
      communityScore: 88,
      lastPosted: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextAvailable: new Date(Date.now() + 1 * 60 * 60 * 1000),
      memberCount: 15420,
      groupType: 'public',
      successRate: 94,
      avgResponseTime: 3.2,
      rejectionCount: 2
    },
    {
      id: '2',
      name: 'Construção Civil Brasil',
      url: 'https://facebook.com/groups/987654321',
      enabled: true,
      priority: 8,
      dailyLimit: 2,
      cooldownMinutes: 240,
      riskLevel: 'medium',
      saturationScore: 72,
      allowPromotions: true,
      allowAffiliateLinks: false,
      status: 'active',
      postsToday: 1,
      postsWeek: 8,
      avgEngagement: 67,
      comments: 23,
      reactions: 89,
      communityScore: 71,
      lastPosted: new Date(Date.now() - 4 * 60 * 60 * 1000),
      nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000),
      memberCount: 8930,
      groupType: 'public',
      successRate: 88,
      avgResponseTime: 4.1,
      rejectionCount: 5
    },
    {
      id: '3',
      name: 'Ofertas de Ferramentas',
      url: 'https://facebook.com/groups/555666777',
      enabled: false,
      priority: 6,
      dailyLimit: 5,
      cooldownMinutes: 120,
      riskLevel: 'high',
      saturationScore: 89,
      allowPromotions: false,
      allowAffiliateLinks: false,
      status: 'paused',
      postsToday: 0,
      postsWeek: 3,
      avgEngagement: 45,
      comments: 8,
      reactions: 31,
      communityScore: 52,
      lastPosted: new Date(Date.now() - 24 * 60 * 60 * 1000),
      memberCount: 3210,
      groupType: 'private',
      successRate: 72,
      avgResponseTime: 6.8,
      rejectionCount: 12
    },
    {
      id: '4',
      name: 'Mecânicos e Ferramentas',
      url: 'https://facebook.com/groups/111222333',
      enabled: true,
      priority: 7,
      dailyLimit: 2,
      cooldownMinutes: 200,
      riskLevel: 'low',
      saturationScore: 38,
      allowPromotions: true,
      allowAffiliateLinks: true,
      status: 'cooldown',
      postsToday: 2,
      postsWeek: 11,
      avgEngagement: 91,
      comments: 67,
      reactions: 195,
      communityScore: 94,
      lastPosted: new Date(Date.now() - 30 * 60 * 1000),
      nextAvailable: new Date(Date.now() + 3 * 60 * 60 * 1000),
      memberCount: 6780,
      groupType: 'public',
      successRate: 96,
      avgResponseTime: 2.8,
      rejectionCount: 1
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'blocked' | 'cooldown'>('all');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      // Mock API call - replace with real Supabase call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGroups = async () => {
    try {
      setIsSaving(true);
      // Mock API call - replace with real Supabase call
      console.log('Saving groups:', groups);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving groups:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateGroup = (id: string, updates: Partial<Group>) => {
    setGroups(prev => prev.map(group => 
      group.id === id ? { ...group, ...updates } : group
    ));
    setHasChanges(true);
  };

  const toggleGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      updateGroup(id, { 
        enabled: !group.enabled,
        status: !group.enabled ? 'active' : 'paused'
      });
    }
  };

  const resetCooldown = (id: string) => {
    updateGroup(id, { 
      status: 'active',
      nextAvailable: new Date()
    });
  };

  const blockGroup = (id: string, hours: number) => {
    updateGroup(id, { 
      status: 'blocked',
      enabled: false,
      nextAvailable: new Date(Date.now() + hours * 60 * 60 * 1000)
    });
  };

  const getStatusColor = (status: Group['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'blocked': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'cooldown': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskColor = (risk: Group['riskLevel']) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSaturationColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const filteredGroups = groups.filter(group => 
    filterStatus === 'all' || group.status === filterStatus
  );

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
          <h1 className="text-3xl font-bold text-white mb-2">Grupos</h1>
          <p className="text-gray-400">
            Gerencie grupos, métricas e configurações de postagem
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-white"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="paused">Pausados</option>
            <option value="blocked">Bloqueados</option>
            <option value="cooldown">Cooldown</option>
          </select>
          
          <button
            onClick={loadGroups}
            className="premium-button px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={saveGroups}
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Ativos</div>
              <div className="text-2xl font-bold text-green-400">
                {groups.filter(g => g.enabled).length}
              </div>
            </div>
            <Play className="w-5 h-5 text-green-400" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Posts Hoje</div>
              <div className="text-2xl font-bold text-accent">
                {groups.reduce((sum, g) => sum + g.postsToday, 0)}
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-accent" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Alto Risco</div>
              <div className="text-2xl font-bold text-red-400">
                {groups.filter(g => g.riskLevel === 'high').length}
              </div>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Score Médio</div>
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round(groups.reduce((sum, g) => sum + g.communityScore, 0) / groups.length)}%
              </div>
            </div>
            <BarChart3 className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-border">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Grupo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Prioridade</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Limites</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Saturação</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Métricas</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Performance</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredGroups.map((group) => (
                <tr 
                  key={group.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{group.name}</div>
                        <div className="text-xs text-gray-400">
                          {group.memberCount.toLocaleString('pt-BR')} membros • {group.groupType}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        getStatusColor(group.status)
                      )}
                    >
                      {group.enabled ? (
                        <>
                          <Play className="w-3 h-3 inline mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 inline mr-1" />
                          Pausado
                        </>
                      )}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={group.priority}
                        onChange={(e) => updateGroup(group.id, { priority: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 bg-surface border border-border rounded text-white text-center"
                      />
                      <div className="flex flex-col">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              i < group.priority / 2 ? "bg-accent" : "bg-gray-600"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diário:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={group.dailyLimit}
                          onChange={(e) => updateGroup(group.id, { dailyLimit: parseInt(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-surface border border-border rounded text-white text-center"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cooldown:</span>
                        <input
                          type="number"
                          min="30"
                          max="480"
                          value={group.cooldownMinutes}
                          onChange={(e) => updateGroup(group.id, { cooldownMinutes: parseInt(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-surface border border-border rounded text-white text-center"
                        />
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            group.saturationScore >= 80 ? "bg-red-500" :
                            group.saturationScore >= 60 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${group.saturationScore}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", getSaturationColor(group.saturationScore))}>
                        {group.saturationScore}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hoje:</span>
                        <span className="text-white">{group.postsToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Engaj:</span>
                        <span className="text-white">{group.avgEngagement}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Score:</span>
                        <span className="text-white">{group.communityScore}%</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sucesso:</span>
                        <span className={cn(
                          "font-medium",
                          group.successRate >= 90 ? "text-green-400" :
                          group.successRate >= 75 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {group.successRate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rejeições:</span>
                        <span className="text-white">{group.rejectionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tempo:</span>
                        <span className="text-white">{group.avgResponseTime}s</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {group.status === 'cooldown' && (
                        <button
                          onClick={() => resetCooldown(group.id)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Resetar Cooldown"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => blockGroup(group.id, 24)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Bloquear"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Ações Rápidas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              groups.filter(g => g.status === 'cooldown').forEach(g => 
                resetCooldown(g.id)
              );
            }}
            className="p-4 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Resetar Todos Cooldowns</div>
          </button>
          
          <button
            onClick={() => {
              groups.filter(g => g.riskLevel === 'high').forEach(g => 
                updateGroup(g.id, { enabled: false, status: 'paused' })
              );
            }}
            className="p-4 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            <Shield className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Pausar Alto Risco</div>
          </button>
          
          <button
            onClick={() => {
              groups.filter(g => g.communityScore >= 85 && g.saturationScore < 50).forEach(g => 
                updateGroup(g.id, { enabled: true, status: 'active' })
              );
            }}
            className="p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <Play className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Ativar Alta Performance</div>
          </button>
        </div>
      </motion.div>

      {/* Group Details Modal */}
      {selectedGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedGroup(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                {selectedGroup.name}
              </h3>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">URL</label>
                  <input
                    type="text"
                    value={selectedGroup.url}
                    onChange={(e) => updateGroup(selectedGroup.id, { url: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Prioridade (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedGroup.priority}
                    onChange={(e) => updateGroup(selectedGroup.id, { priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Limite Diário</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedGroup.dailyLimit}
                    onChange={(e) => updateGroup(selectedGroup.id, { dailyLimit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Cooldown (minutos)</label>
                  <input
                    type="number"
                    min="30"
                    max="480"
                    value={selectedGroup.cooldownMinutes}
                    onChange={(e) => updateGroup(selectedGroup.id, { cooldownMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                  />
                </div>
              </div>
              
              {/* Permissions */}
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-3">Permissões</div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => updateGroup(selectedGroup.id, { allowPromotions: !selectedGroup.allowPromotions })}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2",
                        selectedGroup.allowPromotions
                          ? "bg-green-500/20 border-green-500/30 text-green-400"
                          : "bg-surface border border-border text-gray-400"
                      )}
                    >
                      <Target className="w-4 h-4" />
                      Permitir Promoções: {selectedGroup.allowPromotions ? 'Sim' : 'Não'}
                    </button>
                    
                    <button
                      onClick={() => updateGroup(selectedGroup.id, { allowAffiliateLinks: !selectedGroup.allowAffiliateLinks })}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2",
                        selectedGroup.allowAffiliateLinks
                          ? "bg-green-500/20 border-green-500/30 text-green-400"
                          : "bg-surface border border-border text-gray-400"
                      )}
                    >
                      <Activity className="w-4 h-4" />
                      Permitir Links Afiliados: {selectedGroup.allowAffiliateLinks ? 'Sim' : 'Não'}
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Status</div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-medium border inline-block", getStatusColor(selectedGroup.status))}>
                    {selectedGroup.status}
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Tipo</div>
                  <div className="text-sm font-medium text-white capitalize">
                    {selectedGroup.groupType}
                  </div>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Membros</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedGroup.memberCount.toLocaleString('pt-BR')}
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Score Comunidade</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          selectedGroup.communityScore >= 80 ? "bg-green-500" :
                          selectedGroup.communityScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${selectedGroup.communityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {selectedGroup.communityScore}%
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Performance</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sucesso:</span>
                      <span className={cn(
                        "font-medium",
                        selectedGroup.successRate >= 90 ? "text-green-400" :
                        selectedGroup.successRate >= 75 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {selectedGroup.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rejeições:</span>
                      <span className="text-white">{selectedGroup.rejectionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tempo médio:</span>
                      <span className="text-white">{selectedGroup.avgResponseTime}s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 bg-surface border border-border text-gray-400 rounded-lg hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  saveGroups();
                }}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
              >
                Salvar Alterações
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
