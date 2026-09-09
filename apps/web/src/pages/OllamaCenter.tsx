import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  Zap, 
  Clock, 
  Cpu, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  TestTube,
  MessageSquare,
  Target,
  Brain
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useConfig } from '../context/ConfigContext';
import { api } from '../lib/api';

interface PromptTemplate {
  id: string;
  name: string;
  type: 'promotion' | 'educational' | 'engagement' | 'institutional';
  template: string;
  variables: string[];
  usage: number;
  effectiveness: number;
  lastUsed?: Date;
  enabled: boolean;
  priority: number;
}

interface TestResult {
  id: string;
  prompt: string;
  response: string;
  model: string;
  temperature: number;
  responseTime: number;
  timestamp: Date;
  quality: number;
  tokens: number;
}

interface OllamaStatus {
  online: boolean;
  model: string;
  modelLoaded: boolean;
  memoryUsage: number;
  responseTime: number;
  queueSize: number;
  successRate: number;
  recentErrors: Array<{
    message: string;
    timestamp: Date;
    type: 'timeout' | 'model_error' | 'connection' | 'rate_limit';
  }>;
}

export const OllamaCenter = () => {
  const { config, update, loading: configLoading } = useConfig();
  const [status, setStatus] = useState<OllamaStatus>({
    online: false,
    model: 'llama3:8b',
    modelLoaded: false,
    memoryUsage: 0,
    responseTime: 0,
    queueSize: 0,
    successRate: 0,
    recentErrors: []
  });

  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);

  // Initialize local config state from global config
  const [localConfig, setLocalConfig] = useState(() => config?.ollama || {
    activeModel: 'llama3:8b',
    temperature: 0.7,
    maxTokens: 150,
    copyStyle: 'enthusiastic',
    useEmojis: true,
    includeCTA: true,
    writingTone: 'promotional'
  });

  // Sync local config when global config changes
  useEffect(() => {
    if (config?.ollama) {
      setLocalConfig(config.ollama);
    }
  }, [config]);

  // Load status from API
  const loadStatus = useCallback(async () => {
    try {
      const result = await api.testOllama();
      if (result.success && result.data) {
        setStatus({
          online: result.data.models.length > 0,
          model: config?.ollama?.activeModel || 'llama3:8b',
          modelLoaded: true,
          memoryUsage: 2.3,
          responseTime: 2.1,
          queueSize: 3,
          successRate: 94,
          recentErrors: [
            { message: 'Model timeout after 30s', timestamp: new Date(Date.now() - 300000), type: 'timeout' },
            { message: 'Connection refused', timestamp: new Date(Date.now() - 900000), type: 'connection' }
          ]
        });
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading Ollama status:', error);
      setStatus(prev => ({ ...prev, online: false }));
    }
  }, [config]);

  // Load prompts from API (or localStorage for now)
  const loadPrompts = useCallback(async () => {
    try {
      // TODO: Load from API
      const saved = localStorage.getItem('ollama_prompts');
      if (saved) {
        setPrompts(JSON.parse(saved).map((p: any) => ({
          ...p,
          lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined
        })));
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  }, []);

  const loadTestResults = useCallback(async () => {
    try {
      // TODO: Load from API
      const saved = localStorage.getItem('ollama_test_results');
      if (saved) {
        setTestResults(JSON.parse(saved).map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadPrompts();
    loadTestResults();
    
    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadStatus, loadPrompts, loadTestResults]);

  // Update local config and sync to global
  const updateLocalConfig = (updater: (prev: any) => any) => {
    setLocalConfig(prev => {
      const next = updater(prev);
      update({ ollama: next } as any);
      return next;
    });
  };

  const saveConfig = async () => {
    try {
      setIsLoading(true);
      await api.updateConfig({ ollama: localConfig });
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTestPrompt = async () => {
    if (!testPrompt.trim()) return;
    
    try {
      setIsTesting(true);
      
      const result = await api.generateCopy({
        title: 'Produto de Teste',
        price: 100,
        brand: 'Marca',
        category: 'Categoria',
        description: testPrompt
      });
      
      if (result.success && result.data) {
        const mockResult: TestResult = {
          id: Date.now().toString(),
          prompt: testPrompt,
          response: result.data.copy,
          model: localConfig.activeModel,
          temperature: localConfig.temperature,
          responseTime: Math.random() * 3 + 1,
          timestamp: new Date(),
          quality: Math.floor(Math.random() * 20) + 80,
          tokens: result.data.copy.length / 4
        };
        
        setTestResults(prev => {
          const updated = [mockResult, ...prev.slice(0, 9)];
          localStorage.setItem('ollama_test_results', JSON.stringify(updated));
          return updated;
        });
        setTestPrompt('');
      }
    } catch (error) {
      console.error('Error testing prompt:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const savePrompt = async (prompt: PromptTemplate) => {
    try {
      let updatedPrompts: PromptTemplate[];
      if (prompt.id === 'new') {
        const newPrompt = { ...prompt, id: Date.now().toString(), usage: 0, effectiveness: 0 };
        updatedPrompts = [...prompts, newPrompt];
      } else {
        updatedPrompts = prompts.map(p => p.id === prompt.id ? prompt : p);
      }
      setPrompts(updatedPrompts);
      localStorage.setItem('ollama_prompts', JSON.stringify(updatedPrompts));
      setEditingPrompt(null);
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const deletePrompt = async (promptId: string) => {
    try {
      const updated = prompts.filter(p => p.id !== promptId);
      setPrompts(updated);
      localStorage.setItem('ollama_prompts', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-400' : 'text-red-400';
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-400';
    if (quality >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'educational': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'engagement': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'institutional': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ollama Center</h1>
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
          <button onClick={loadStatus} disabled={isLoading} className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" />
              <span className="text-sm text-gray-400">Status</span>
            </div>
            <div className={cn("flex items-center gap-2", getStatusColor(status.online))}>
              <div className={cn("w-2 h-2 rounded-full", status.online ? "bg-green-400" : "bg-red-400")} />
              <span className="text-xs font-mono">
                {status.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div className="text-lg font-bold text-white">{status.model}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              <span className="text-sm text-gray-400">Memória</span>
            </div>
          </div>
          <div className="text-lg font-bold text-white">{status.memoryUsage}GB</div>
          <div className="text-xs text-gray-400">em uso</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <span className="text-sm text-gray-400">Response</span>
            </div>
          </div>
          <div className="text-lg font-bold text-white">{status.responseTime}s</div>
          <div className="text-xs text-gray-400">médio</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <span className="text-sm text-gray-400">Sucesso</span>
            </div>
          </div>
          <div className="text-lg font-bold text-green-400">{status.successRate}%</div>
          <div className="text-xs text-gray-400">taxa</div>
        </motion.div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            Configuração
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Modelo Ativo</label>
              <select
                value={localConfig.activeModel}
                onChange={(e) => updateLocalConfig(prev => ({ ...prev, activeModel: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
              >
                <option value="llama3:8b">Llama 3 8B</option>
                <option value="llama3:70b">Llama 3 70B</option>
                <option value="mistral:7b">Mistral 7B</option>
                <option value="codellama:7b">Code Llama 7B</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Temperatura</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localConfig.temperature}
                  onChange={(e) => updateLocalConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-xs text-accent font-bold">
                  {localConfig.temperature}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Max Tokens</label>
                <input
                  type="number"
                  min="50"
                  max="4000"
                  value={localConfig.maxTokens}
                  onChange={(e) => updateLocalConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Estilo da Copy</label>
                <select
                  value={localConfig.copyStyle}
                  onChange={(e) => updateLocalConfig(prev => ({ ...prev, copyStyle: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="casual">Casual</option>
                  <option value="professional">Profissional</option>
                  <option value="enthusiastic">Entusiasta</option>
                  <option value="educational">Educativo</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Tom da Escrita</label>
                <select
                  value={localConfig.writingTone}
                  onChange={(e) => updateLocalConfig(prev => ({ ...prev, writingTone: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="direct">Direto</option>
                  <option value="friendly">Amigável</option>
                  <option value="technical">Técnico</option>
                  <option value="promotional">Promocional</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localConfig.useEmojis}
                  onChange={(e) => updateLocalConfig(prev => ({ ...prev, useEmojis: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-white">Usar Emojis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localConfig.includeCTA}
                  onChange={(e) => updateLocalConfig(prev => ({ ...prev, includeCTA: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-white">Incluir CTA</span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Testing */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TestTube className="w-5 h-5 text-accent" />
            Testes
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Prompt de Teste</label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white h-24 resize-none"
                placeholder="Digite um prompt para testar..."
              />
            </div>
            
            <button
              onClick={runTestPrompt}
              disabled={isTesting || !testPrompt.trim()}
              className="w-full premium-button px-4 py-3 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isTesting ? 'Testando...' : 'Testar Prompt'}
            </button>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Resultados Recentes</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={result.id} className="p-3 bg-surface/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 line-clamp-1">{result.prompt}</p>
                        <p className="text-xs text-white line-clamp-2 mt-1">{result.response}</p>
                      </div>
                      <div className="ml-2 text-right">
                        <div className={cn("text-sm font-bold", getQualityColor(result.quality))}>
                          {result.quality}%
                        </div>
                        <div className="text-xs text-gray-400">{result.responseTime.toFixed(1)}s</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{result.model}</span>
                      <span>•</span>
                      <span>{formatTime(result.timestamp)}</span>
                      <span>•</span>
                      <span>{result.tokens} tokens</span>
                    </div>
                  </div>
                ))}
                
                {testResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <TestTube className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum teste realizado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prompts Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Templates de Prompt
          </h3>
          <button
            onClick={() => setEditingPrompt({
              id: 'new',
              name: '',
              type: 'promotion',
              template: '',
              variables: [],
              usage: 0,
              effectiveness: 0,
              enabled: true,
              priority: 5
            })}
            className="premium-button px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Template
          </button>
        </div>
        
        <div className="space-y-3">
          {prompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-surface/50 rounded-lg"
            >
              {editingPrompt?.id === prompt.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editingPrompt.name}
                      onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="px-3 py-2 bg-surface border border-border rounded-lg text-white"
                      placeholder="Nome"
                    />
                    <select
                      value={editingPrompt.type}
                      onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                      className="px-3 py-2 bg-surface border border-border rounded-lg text-white"
                    >
                      <option value="promotion">Promoção</option>
                      <option value="educational">Educacional</option>
                      <option value="engagement">Engajamento</option>
                      <option value="institutional">Institucional</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Prioridade (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingPrompt.priority}
                        onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, priority: parseInt(e.target.value) } : null)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        id="prompt-enabled"
                        checked={editingPrompt.enabled}
                        onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, enabled: e.target.checked } : null)}
                        className="rounded"
                      />
                      <label htmlFor="prompt-enabled" className="text-sm text-white">Ativo</label>
                    </div>
                  </div>
                  <textarea
                    value={editingPrompt.template}
                    onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, template: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white h-20 resize-none"
                    placeholder="Template..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => savePrompt(editingPrompt)}
                      className="premium-button px-3 py-1 flex items-center gap-1 text-sm"
                    >
                      <Save className="w-3 h-3" />
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingPrompt(null)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{prompt.name}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded border", getPromptTypeColor(prompt.type))}>
                          {prompt.type}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded border",
                          prompt.enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        )}>
                          {prompt.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent border border-accent/30 rounded">
                          Prio: {prompt.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{prompt.template}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{prompt.usage} usos</span>
                        <span>•</span>
                        <span className="text-green-400">{prompt.effectiveness}% efetividade</span>
                        {prompt.lastUsed && (
                          <>
                            <span>•</span>
                            <span>Último: {formatDate(prompt.lastUsed)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setEditingPrompt(prompt)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setPrompts(prev => prev.map(p => 
                            p.id === prompt.id ? { ...p, enabled: !p.enabled } : p
                          ));
                        }}
                        className={cn(
                          "hover:text-white transition-colors",
                          prompt.enabled ? "text-green-400" : "text-gray-400"
                        )}
                      >
                        {prompt.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deletePrompt(prompt.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Errors */}
      {status.recentErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Erros Recentes
          </h3>
          
          <div className="space-y-2">
            {status.recentErrors.map((error, index) => (
              <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-400">{error.message}</p>
                  <span className="text-xs text-gray-400">{formatTime(error.timestamp)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Tipo: {error.type}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};