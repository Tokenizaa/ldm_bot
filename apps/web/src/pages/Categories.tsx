import React, { useState, useEffect } from 'react';
import { 
  Folder, 
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
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Category {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  priority: number;
  cooldownHours: number;
  saturationScore: number;
  lastPosted?: Date;
  postsToday: number;
  postsWeek: number;
  avgEngagement: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'blocked' | 'cooldown';
}

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      slug: 'ferramentas-eletricas',
      name: 'Ferramentas Elétricas',
      enabled: true,
      priority: 8,
      cooldownHours: 24,
      saturationScore: 65,
      lastPosted: new Date(Date.now() - 4 * 60 * 60 * 1000),
      postsToday: 2,
      postsWeek: 12,
      avgEngagement: 78,
      riskLevel: 'low',
      status: 'active'
    },
    {
      id: '2',
      slug: 'automotivo',
      name: 'Automotivo',
      enabled: true,
      priority: 7,
      cooldownHours: 18,
      saturationScore: 82,
      lastPosted: new Date(Date.now() - 2 * 60 * 60 * 1000),
      postsToday: 3,
      postsWeek: 18,
      avgEngagement: 65,
      riskLevel: 'medium',
      status: 'active'
    },
    {
      id: '3',
      slug: 'construcao-civil',
      name: 'Construção Civil',
      enabled: false,
      priority: 6,
      cooldownHours: 36,
      saturationScore: 45,
      lastPosted: new Date(Date.now() - 24 * 60 * 60 * 1000),
      postsToday: 0,
      postsWeek: 5,
      avgEngagement: 82,
      riskLevel: 'low',
      status: 'paused'
    },
    {
      id: '4',
      slug: 'jardim-e-paisagismo',
      name: 'Jardim e Paisagismo',
      enabled: true,
      priority: 5,
      cooldownHours: 48,
      saturationScore: 28,
      lastPosted: new Date(Date.now() - 48 * 60 * 60 * 1000),
      postsToday: 1,
      postsWeek: 3,
      avgEngagement: 91,
      riskLevel: 'low',
      status: 'cooldown'
    },
    {
      id: '5',
      slug: 'seguranca-trabalho',
      name: 'Segurança do Trabalho',
      enabled: true,
      priority: 9,
      cooldownHours: 12,
      saturationScore: 71,
      lastPosted: new Date(Date.now() - 6 * 60 * 60 * 1000),
      postsToday: 4,
      postsWeek: 22,
      avgEngagement: 73,
      riskLevel: 'medium',
      status: 'active'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      // Mock API call - replace with real Supabase call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCategories = async () => {
    try {
      setIsSaving(true);
      // Mock API call - replace with real Supabase call
      console.log('Saving categories:', categories);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving categories:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
    setHasChanges(true);
  };

  const toggleCategory = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category) {
      updateCategory(id, { 
        enabled: !category.enabled,
        status: !category.enabled ? 'active' : 'paused'
      });
    }
  };

  const resetCooldown = (id: string) => {
    updateCategory(id, { 
      status: 'active',
      lastPosted: new Date()
    });
  };

  const blockCategory = (id: string, hours: number) => {
    updateCategory(id, { 
      status: 'blocked',
      enabled: false
    });
  };

  const getStatusColor = (status: Category['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'blocked': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'cooldown': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskColor = (risk: Category['riskLevel']) => {
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
          <h1 className="text-3xl font-bold text-white mb-2">Categorias</h1>
          <p className="text-gray-400">
            Gerencie rotação de categorias e prioridades
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={loadCategories}
            className="premium-button px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={saveCategories}
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
              <div className="text-sm text-gray-400">Ativas</div>
              <div className="text-2xl font-bold text-green-400">
                {categories.filter(cat => cat.enabled).length}
              </div>
            </div>
            <Play className="w-5 h-5 text-green-400" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Pausadas</div>
              <div className="text-2xl font-bold text-yellow-400">
                {categories.filter(cat => !cat.enabled && cat.status !== 'blocked').length}
              </div>
            </div>
            <Pause className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Alto Risco</div>
              <div className="text-2xl font-bold text-red-400">
                {categories.filter(cat => cat.riskLevel === 'high').length}
              </div>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        </div>
        
        <div className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Posts Hoje</div>
              <div className="text-2xl font-bold text-accent">
                {categories.reduce((sum, cat) => sum + cat.postsToday, 0)}
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-border">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Categoria</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Prioridade</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Cooldown</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Saturação</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Posts</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Engajamento</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Risco</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {categories.map((category) => (
                <tr 
                  key={category.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-accent" />
                      <div>
                        <div className="text-sm font-medium text-white">{category.name}</div>
                        <div className="text-xs text-gray-400">{category.slug}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        getStatusColor(category.status)
                      )}
                    >
                      {category.enabled ? (
                        <>
                          <Play className="w-3 h-3 inline mr-1" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 inline mr-1" />
                          Pausada
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
                        value={category.priority}
                        onChange={(e) => updateCategory(category.id, { priority: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 bg-surface border border-border rounded text-white text-center"
                      />
                      <div className="flex flex-col">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              i < category.priority / 2 ? "bg-accent" : "bg-gray-600"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={category.cooldownHours}
                        onChange={(e) => updateCategory(category.id, { cooldownHours: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 bg-surface border border-border rounded text-white text-center"
                      />
                      <span className="text-xs text-gray-400">h</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            category.saturationScore >= 80 ? "bg-red-500" :
                            category.saturationScore >= 60 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${category.saturationScore}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", getSaturationColor(category.saturationScore))}>
                        {category.saturationScore}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hoje:</span>
                        <span className="text-white">{category.postsToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Semana:</span>
                        <span className="text-white">{category.postsWeek}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{category.avgEngagement}%</span>
                      {category.avgEngagement > 75 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : category.avgEngagement < 50 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : null}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={cn("text-xs font-medium", getRiskColor(category.riskLevel))}>
                      {category.riskLevel === 'low' ? 'Baixo' :
                       category.riskLevel === 'medium' ? 'Médio' : 'Alto'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {category.status === 'cooldown' && (
                        <button
                          onClick={() => resetCooldown(category.id)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Resetar Cooldown"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => blockCategory(category.id, 24)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Bloquear"
                      >
                        <XCircle className="w-4 h-4" />
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
              categories.filter(cat => cat.status === 'cooldown').forEach(cat => 
                resetCooldown(cat.id)
              );
            }}
            className="p-4 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Resetar Todos Cooldowns</div>
          </button>
          
          <button
            onClick={() => {
              categories.filter(cat => cat.riskLevel === 'high').forEach(cat => 
                updateCategory(cat.id, { enabled: false, status: 'paused' })
              );
            }}
            className="p-4 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            <Shield className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Pausar Alto Risco</div>
          </button>
          
          <button
            onClick={() => {
              categories.filter(cat => cat.saturationScore < 30).forEach(cat => 
                updateCategory(cat.id, { enabled: true, status: 'active' })
              );
            }}
            className="p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <Play className="w-5 h-5 mb-2" />
            <div className="text-sm font-medium">Ativar Baixa Saturação</div>
          </button>
        </div>
      </motion.div>

      {/* Category Details Modal */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedCategory(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-accent" />
                {selectedCategory.name}
              </h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Slug</label>
                  <input
                    type="text"
                    value={selectedCategory.slug}
                    onChange={(e) => updateCategory(selectedCategory.id, { slug: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Prioridade (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedCategory.priority}
                    onChange={(e) => updateCategory(selectedCategory.id, { priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Cooldown (horas)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={selectedCategory.cooldownHours}
                    onChange={(e) => updateCategory(selectedCategory.id, { cooldownHours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Status</div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-medium border inline-block", getStatusColor(selectedCategory.status))}>
                    {selectedCategory.status}
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Score Saturação</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          selectedCategory.saturationScore >= 80 ? "bg-red-500" :
                          selectedCategory.saturationScore >= 60 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${selectedCategory.saturationScore}%` }}
                      />
                    </div>
                    <span className={cn("text-sm font-medium", getSaturationColor(selectedCategory.saturationScore))}>
                      {selectedCategory.saturationScore}%
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Nível Risco</div>
                  <span className={cn("text-sm font-medium", getRiskColor(selectedCategory.riskLevel))}>
                    {selectedCategory.riskLevel === 'low' ? 'Baixo' :
                     selectedCategory.riskLevel === 'medium' ? 'Médio' : 'Alto'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 bg-surface border border-border text-gray-400 rounded-lg hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  saveCategories();
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
