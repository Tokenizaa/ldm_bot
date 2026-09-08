import React, { useState } from 'react';
import { Save, RefreshCw, Bot, Clock, Package, Brain, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export const Settings = () => {
  const { config, update, loading, refresh } = useConfig();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'facebook' | 'ollama' | 'crawler' | 'planning'>('system');

  if (!config) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-gray-400">Carregando configurações...</p>
      </div>
    );
  }

  const updateSection = (section: keyof typeof config, updater: (prev: any) => any) => {
    update({ [section]: updater(config[section]) } as any);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.saveConfig(config);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'system', label: 'Sistema', icon: SettingsIcon },
    { id: 'facebook', label: 'Facebook', icon: Bot },
    { id: 'ollama', label: 'Ollama', icon: Brain },
    { id: 'crawler', label: 'Crawler', icon: Package },
    { id: 'planning', label: 'Planejamento', icon: Calendar }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-gray-400">Gerencie todas as configurações do sistema</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving} className="premium-button px-4 py-2 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
          <button onClick={refresh} disabled={loading} className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="premium-card p-2">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="premium-card p-6">
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">CDP Port</label>
                <input
                  type="number"
                  min="9222"
                  max="9230"
                  value={config.system.cdpPort}
                  onChange={(e) => updateSection('system', prev => ({ ...prev, cdpPort: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Log Level</label>
                <select
                  value={config.system.logLevel}
                  onChange={(e) => updateSection('system', prev => ({ ...prev, logLevel: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={config.system.autoStart}
                  onChange={(e) => updateSection('system', prev => ({ ...prev, autoStart: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="autoStart" className="text-white">Auto Start</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="backupEnabled"
                  checked={config.system.backupEnabled}
                  onChange={(e) => updateSection('system', prev => ({ ...prev, backupEnabled: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="backupEnabled" className="text-white">Backup Enabled</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emergencyStop"
                  checked={config.system.emergencyStop}
                  onChange={(e) => updateSection('system', prev => ({ ...prev, emergencyStop: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="emergencyStop" className="text-white">Emergency Stop</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'facebook' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Facebook</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Posts por Dia</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.facebook.postsPerDay}
                  onChange={(e) => updateSection('facebook', prev => ({ ...prev, postsPerDay: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Delay Entre Posts (min)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={config.facebook.delayBetweenPosts}
                  onChange={(e) => updateSection('facebook', prev => ({ ...prev, delayBetweenPosts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Modo</label>
                <select
                  value={config.facebook.mode}
                  onChange={(e) => updateSection('facebook', prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="safe">Seguro</option>
                  <option value="aggressive">Agressivo</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Nível Humanização (0-100)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.facebook.humanizationLevel}
                  onChange={(e) => updateSection('facebook', prev => ({ ...prev, humanizationLevel: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-xs text-accent font-bold mt-1">{config.facebook.humanizationLevel}%</div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">CTA Padrão</label>
                <input
                  type="text"
                  value={config.facebook.defaultCTA}
                  onChange={(e) => updateSection('facebook', prev => ({ ...prev, defaultCTA: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">Grupos Ativos</h4>
              {config.facebook.activeGroups.map((group, index) => (
                <div key={group.id} className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg mb-2">
                  <input
                    type="checkbox"
                    checked={group.active}
                    onChange={(e) => updateSection('facebook', prev => ({
                      ...prev,
                      activeGroups: prev.activeGroups.map((g, i) => i === index ? { ...g, active: e.target.checked } : g)
                    }))}
                    className="rounded"
                  />
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => updateSection('facebook', prev => ({
                      ...prev,
                      activeGroups: prev.activeGroups.map((g, i) => i === index ? { ...g, name: e.target.value } : g)
                    }))}
                    className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm flex-1"
                  />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={group.limit}
                    onChange={(e) => updateSection('facebook', prev => ({
                      ...prev,
                      activeGroups: prev.activeGroups.map((g, i) => i === index ? { ...g, limit: parseInt(e.target.value) } : g)
                    }))}
                    className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-white text-sm text-center"
                  />
                  <span className="text-xs text-gray-400">Limite/dia</span>
                </div>
              ))}
              <button
                onClick={() => updateSection('facebook', prev => ({
                  ...prev,
                  activeGroups: [...prev.activeGroups, { id: Date.now().toString(), name: 'Novo Grupo', limit: 3, active: true }]
                }))}
                className="text-accent hover:text-accent/80 text-sm font-medium"
              >
                + Adicionar Grupo
              </button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">Horários Ativos</h4>
              <div className="grid grid-cols-6 gap-2">
                {[...Array(24).keys()].map(hour => (
                  <button
                    key={hour}
                    onClick={() => updateSection('facebook', prev => ({
                      ...prev,
                      activeHours: prev.activeHours.includes(hour)
                        ? prev.activeHours.filter(h => h !== hour)
                        : [...prev.activeHours, hour]
                    }))}
                    className={cn(
                      "py-1 px-2 text-xs rounded border transition-colors",
                      config.facebook.activeHours.includes(hour)
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
        )}

        {activeTab === 'ollama' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Ollama</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Modelo Ativo</label>
                <select
                  value={config.ollama.activeModel}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, activeModel: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="llama3:8b">Llama 3 8B</option>
                  <option value="llama3:70b">Llama 3 70B</option>
                  <option value="mistral:7b">Mistral 7B</option>
                  <option value="codellama:7b">Code Llama 7B</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Temperatura</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.ollama.temperature}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-xs text-accent font-bold mt-1">{config.ollama.temperature}</div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Max Tokens</label>
                <input
                  type="number"
                  min="50"
                  max="4000"
                  value={config.ollama.maxTokens}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Estilo da Copy</label>
                <select
                  value={config.ollama.copyStyle}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, copyStyle: e.target.value }))}
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
                  value={config.ollama.writingTone}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, writingTone: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="direct">Direto</option>
                  <option value="friendly">Amigável</option>
                  <option value="technical">Técnico</option>
                  <option value="promotional">Promocional</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-border pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.ollama.useEmojis}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, useEmojis: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-white">Usar Emojis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.ollama.includeCTA}
                  onChange={(e) => updateSection('ollama', prev => ({ ...prev, includeCTA: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-white">Incluir CTA</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'crawler' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Crawler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Produtos Máximos</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.crawler.maxProducts}
                  onChange={(e) => updateSection('crawler', prev => ({ ...prev, maxProducts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Delay Scraping (s)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.crawler.scrapingDelay}
                  onChange={(e) => updateSection('crawler', prev => ({ ...prev, scrapingDelay: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Score Mínimo</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.crawler.minScore}
                  onChange={(e) => updateSection('crawler', prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-xs text-accent font-bold mt-1">{config.crawler.minScore}</div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">Categorias Ativas</h4>
              {config.crawler.activeCategories.map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg mb-2">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={(e) => updateSection('crawler', prev => ({
                      ...prev,
                      activeCategories: prev.activeCategories.filter((_, i) => i !== index)
                    }))}
                    className="rounded"
                  />
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => updateSection('crawler', prev => ({
                      ...prev,
                      activeCategories: prev.activeCategories.map((c, i) => i === index ? { ...c, name: e.target.value } : c)
                    }))}
                    className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm flex-1"
                  />
                  <input
                    type="url"
                    value={cat.url}
                    onChange={(e) => updateSection('crawler', prev => ({
                      ...prev,
                      activeCategories: prev.activeCategories.map((c, i) => i === index ? { ...c, url: e.target.value } : c)
                    }))}
                    className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm w-64"
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cat.priority}
                    onChange={(e) => updateSection('crawler', prev => ({
                      ...prev,
                      activeCategories: prev.activeCategories.map((c, i) => i === index ? { ...c, priority: parseInt(e.target.value) } : c)
                    }))}
                    className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-white text-sm text-center"
                  />
                  <span className="text-xs text-gray-400">Prioridade</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Planejamento de Conteúdo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Posts Promocionais</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={config.planning.promotionalPosts}
                  onChange={(e) => updateSection('planning', prev => ({ ...prev, promotionalPosts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Posts Educativos</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={config.planning.educationalPosts}
                  onChange={(e) => updateSection('planning', prev => ({ ...prev, educationalPosts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Posts Engajamento</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={config.planning.engagementPosts}
                  onChange={(e) => updateSection('planning', prev => ({ ...prev, engagementPosts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Posts Institucionais</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={config.planning.institutionalPosts}
                  onChange={(e) => updateSection('planning', prev => ({ ...prev, institutionalPosts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Total Diário</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={config.planning.totalDailyPosts}
                  onChange={(e) => updateSection('planning', prev => ({ ...prev, totalDailyPosts: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Estratégia de Rotação</label>
                <select
                  value={config.planning.rotationStrategy}
                  onChange={(e) => updateSection('planning', prev => ({ ...prev, rotationStrategy: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="balanced">Balanceado</option>
                  <option value="promotion-focused">Foco Promoção</option>
                  <option value="engagement-focused">Foco Engajamento</option>
                </select>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">Soma Total: {config.planning.promotionalPosts + config.planning.educationalPosts + config.planning.engagementPosts + config.planning.institutionalPosts}</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded">
                  <div className="text-2xl font-bold text-green-400">{config.planning.promotionalPosts}</div>
                  <div className="text-xs text-gray-400">Promocional</div>
                </div>
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                  <div className="text-2xl font-bold text-blue-400">{config.planning.educationalPosts}</div>
                  <div className="text-xs text-gray-400">Educativo</div>
                </div>
                <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded">
                  <div className="text-2xl font-bold text-purple-400">{config.planning.engagementPosts}</div>
                  <div className="text-xs text-gray-400">Engajamento</div>
                </div>
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded">
                  <div className="text-2xl font-bold text-yellow-400">{config.planning.institutionalPosts}</div>
                  <div className="text-xs text-gray-400">Institucional</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};