import { useState, useEffect } from 'react';
import { SystemConfig, DEFAULT_CONFIG } from '../types/config';

const CONFIG_KEY = 'forgedeals-config';

export function useConfig() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar configuração do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar configuração no localStorage
  const saveConfig = (newConfig: SystemConfig) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  // Atualizar configuração parcial
  const updateConfig = (updates: Partial<SystemConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setHasChanges(true);
  };

  // Reset para configuração padrão
  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  // Exportar configuração
  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `forgedeals-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Importar configuração
  const importConfig = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          const validatedConfig = { ...DEFAULT_CONFIG, ...imported };
          setConfig(validatedConfig);
          setHasChanges(true);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return {
    config,
    loading,
    hasChanges,
    saveConfig,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig
  };
}
