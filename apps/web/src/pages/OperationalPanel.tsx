import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Facebook, 
  Bot, 
  Database, 
  Play, 
  Pause, 
  Save, 
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  Zap,
  Shield,
  Sliders,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfig } from '../hooks/useConfig';
import { SystemConfig } from '../types/config';
import { cn } from '../lib/utils';

export const OperationalPanel = () => {
  const { 
    config, 
    loading, 
    hasChanges, 
    saveConfig, 
    updateConfig, 
    resetConfig, 
    exportConfig, 
    importConfig 
  } = useConfig();

  const [activeTab, setActiveTab] = useState<'facebook' | 'ollama' | 'crawler' | 'planning' | 'system'>('facebook');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const handleSave = () => {
    saveConfig(config);
    setLastAction('Configuração salva com sucesso!');
    setTimeout(() => setLastAction(''), 3000);
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja resetar para configuração padrão?')) {
      resetConfig();
      setLastAction('Configuração resetada!');
      setTimeout(() => setLastAction(''), 3000);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConfig(file)
        .then(() => setLastAction('Configuração importada com sucesso!'))
        .catch(() => setLastAction('Erro ao importar configuração!'))
        .finally(() => setTimeout(() => setLastAction(''), 3000));
    }
  };

  const tabs = [
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'ollama', label: 'Ollama IA', icon: Bot },
    { id: 'crawler', label: 'Crawler', icon: Target },
    { id: 'planning', label: 'Planejamento', icon: Clock },
    { id: 'system', label: 'Sistema', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Operacional</h1>
          <p className="text-gray-400">Central de controle do ForgeDeals</p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastAction && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">{lastAction}</span>
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              hasChanges 
                ? "bg-accent text-white hover:bg-accent/80" 
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          
          <button
            onClick={exportConfig}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {activeTab === 'facebook' && <FacebookConfig config={config} updateConfig={updateConfig} />}
        {activeTab === 'ollama' && <OllamaConfig config={config} updateConfig={updateConfig} />}
        {activeTab === 'crawler' && <CrawlerConfig config={config} updateConfig={updateConfig} />}
        {activeTab === 'planning' && <PlanningConfig config={config} updateConfig={updateConfig} />}
        {activeTab === 'system' && <SystemConfig config={config} updateConfig={updateConfig} />}
      </div>
    </div>
  );
};

// Facebook Configuration Component
const FacebookConfig = ({ config, updateConfig }: { config: SystemConfig; updateConfig: any }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
      <Facebook className="w-5 h-5" />
      Configuração Facebook
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Posts por dia
        </label>
        <input
          type="number"
          value={config.facebook.postsPerDay}
          onChange={(e) => updateConfig({ 
            facebook: { 
              ...config.facebook, 
              postsPerDay: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Delay entre posts (minutos)
        </label>
        <input
          type="number"
          value={config.facebook.delayBetweenPosts}
          onChange={(e) => updateConfig({ 
            facebook: { 
              ...config.facebook, 
              delayBetweenPosts: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Modo de operação
        </label>
        <select
          value={config.facebook.mode}
          onChange={(e) => updateConfig({ 
            facebook: { 
              ...config.facebook, 
              mode: e.target.value as 'safe' | 'aggressive' 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        >
          <option value="safe">Seguro</option>
          <option value="aggressive">Agressivo</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nível de humanização (0-100)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.facebook.humanizationLevel}
          onChange={(e) => updateConfig({ 
            facebook: { 
              ...config.facebook, 
              humanizationLevel: parseInt(e.target.value) 
            } 
          })}
          className="w-full"
        />
        <div className="text-center text-gray-400">{config.facebook.humanizationLevel}%</div>
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          CTA Padrão
        </label>
        <input
          type="text"
          value={config.facebook.defaultCTA}
          onChange={(e) => updateConfig({ 
            facebook: { 
              ...config.facebook, 
              defaultCTA: e.target.value 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  </div>
);

// Ollama Configuration Component
const OllamaConfig = ({ config, updateConfig }: { config: SystemConfig; updateConfig: any }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
      <Bot className="w-5 h-5" />
      Configuração Ollama IA
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Modelo Ativo
        </label>
        <select
          value={config.ollama.activeModel}
          onChange={(e) => updateConfig({ 
            ollama: { 
              ...config.ollama, 
              activeModel: e.target.value 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        >
          <option value="llama3:8b">Llama 3 8B</option>
          <option value="llama3:70b">Llama 3 70B</option>
          <option value="mistral:7b">Mistral 7B</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Temperatura
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.ollama.temperature}
          onChange={(e) => updateConfig({ 
            ollama: { 
              ...config.ollama, 
              temperature: parseFloat(e.target.value) 
            } 
          })}
          className="w-full"
        />
        <div className="text-center text-gray-400">{config.ollama.temperature}</div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Máximo de Tokens
        </label>
        <input
          type="number"
          value={config.ollama.maxTokens}
          onChange={(e) => updateConfig({ 
            ollama: { 
              ...config.ollama, 
              maxTokens: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Estilo da Copy
        </label>
        <select
          value={config.ollama.copyStyle}
          onChange={(e) => updateConfig({ 
            ollama: { 
              ...config.ollama, 
              copyStyle: e.target.value as any 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        >
          <option value="casual">Casual</option>
          <option value="professional">Profissional</option>
          <option value="enthusiastic">Entusiástico</option>
          <option value="educational">Educacional</option>
        </select>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="useEmojis"
          checked={config.ollama.useEmojis}
          onChange={(e) => updateConfig({ 
            ollama: { 
              ...config.ollama, 
              useEmojis: e.target.checked 
            } 
          })}
          className="w-4 h-4 text-accent bg-gray-700 rounded focus:ring-accent"
        />
        <label htmlFor="useEmojis" className="text-gray-300">
          Usar Emojis
        </label>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="includeCTA"
          checked={config.ollama.includeCTA}
          onChange={(e) => updateConfig({ 
            ollama: { 
              ...config.ollama, 
              includeCTA: e.target.checked 
            } 
          })}
          className="w-4 h-4 text-accent bg-gray-700 rounded focus:ring-accent"
        />
        <label htmlFor="includeCTA" className="text-gray-300">
          Incluir CTA
        </label>
      </div>
    </div>
  </div>
);

// Crawler Configuration Component
const CrawlerConfig = ({ config, updateConfig }: { config: SystemConfig; updateConfig: any }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
      <Target className="w-5 h-5" />
      Configuração Crawler
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Produtos Máximos
        </label>
        <input
          type="number"
          value={config.crawler.maxProducts}
          onChange={(e) => updateConfig({ 
            crawler: { 
              ...config.crawler, 
              maxProducts: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Delay Scraping (segundos)
        </label>
        <input
          type="number"
          value={config.crawler.scrapingDelay}
          onChange={(e) => updateConfig({ 
            crawler: { 
              ...config.crawler, 
              scrapingDelay: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Score Mínimo
        </label>
        <input
          type="number"
          value={config.crawler.minScore}
          onChange={(e) => updateConfig({ 
            crawler: { 
              ...config.crawler, 
              minScore: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  </div>
);

// Planning Configuration Component
const PlanningConfig = ({ config, updateConfig }: { config: SystemConfig; updateConfig: any }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
      <Clock className="w-5 h-5" />
      Configuração Planejamento
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Posts Promocionais
        </label>
        <input
          type="number"
          value={config.planning.promotionalPosts}
          onChange={(e) => updateConfig({ 
            planning: { 
              ...config.planning, 
              promotionalPosts: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Posts Educativos
        </label>
        <input
          type="number"
          value={config.planning.educationalPosts}
          onChange={(e) => updateConfig({ 
            planning: { 
              ...config.planning, 
              educationalPosts: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Posts Engajamento
        </label>
        <input
          type="number"
          value={config.planning.engagementPosts}
          onChange={(e) => updateConfig({ 
            planning: { 
              ...config.planning, 
              engagementPosts: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Posts Institucionais
        </label>
        <input
          type="number"
          value={config.planning.institutionalPosts}
          onChange={(e) => updateConfig({ 
            planning: { 
              ...config.planning, 
              institutionalPosts: parseInt(e.target.value) 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  </div>
);

// System Configuration Component
const SystemConfig = ({ config, updateConfig }: { config: SystemConfig; updateConfig: any }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
      <Settings className="w-5 h-5" />
      Configuração Sistema
    </h2>
    
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoStart"
          checked={config.system.autoStart}
          onChange={(e) => updateConfig({ 
            system: { 
              ...config.system, 
              autoStart: e.target.checked 
            } 
          })}
          className="w-4 h-4 text-accent bg-gray-700 rounded focus:ring-accent"
        />
        <label htmlFor="autoStart" className="text-gray-300">
          Início Automático
        </label>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="backupEnabled"
          checked={config.system.backupEnabled}
          onChange={(e) => updateConfig({ 
            system: { 
              ...config.system, 
              backupEnabled: e.target.checked 
            } 
          })}
          className="w-4 h-4 text-accent bg-gray-700 rounded focus:ring-accent"
        />
        <label htmlFor="backupEnabled" className="text-gray-300">
          Backup Automático
        </label>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="emergencyStop"
          checked={config.system.emergencyStop}
          onChange={(e) => updateConfig({ 
            system: { 
              ...config.system, 
              emergencyStop: e.target.checked 
            } 
          })}
          className="w-4 h-4 text-accent bg-gray-700 rounded focus:ring-accent"
        />
        <label htmlFor="emergencyStop" className="text-gray-300">
          Parada de Emergência
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nível de Log
        </label>
        <select
          value={config.system.logLevel}
          onChange={(e) => updateConfig({ 
            system: { 
              ...config.system, 
              logLevel: e.target.value as any 
            } 
          })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-accent"
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
    </div>
  </div>
);
