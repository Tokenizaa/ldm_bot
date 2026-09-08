import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, type SystemConfig } from '../lib/api';

interface ConfigContextType {
  config: SystemConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (partial: Partial<SystemConfig>) => Promise<void>;
  save: (config: SystemConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getConfig();
      if (result.success) {
        setConfig(result.data);
      } else {
        setError('Falha ao carregar configuração');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (partial: Partial<SystemConfig>) => {
    if (!config) return;
    try {
      setError(null);
      const result = await api.updateConfig(partial);
      if (result.success) {
        setConfig(result.data);
      } else {
        setError('Falha ao atualizar configuração');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  }, [config]);

  const save = useCallback(async (fullConfig: SystemConfig) => {
    try {
      setError(null);
      const result = await api.saveConfig(fullConfig);
      if (result.success) {
        setConfig(result.data);
      } else {
        setError('Falha ao salvar configuração');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ConfigContext.Provider value={{ config, loading, error, refresh, update, save }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig deve ser usado dentro de ConfigProvider');
  }
  return context;
}