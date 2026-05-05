import { useState, useEffect, useCallback } from 'react';
import ChromeConnector from '../modules/browser/chromeConnector';
import BrowserHealth from '../modules/browser/browserHealth';
import SessionMonitor from '../modules/browser/sessionMonitor';
import TabsManager from '../modules/browser/tabsManager';
import { BrowserConfig } from '../modules/browser/browserConfig';

export interface BrowserStatus {
  isConnected: boolean;
  isHealthy: boolean;
  sessionsValid: boolean;
  tabsCount: number;
  uptime: number;
  memoryUsage: number;
  lastCheck: Date;
  issues: string[];
}

export function useBrowser() {
  const [status, setStatus] = useState<BrowserStatus>({
    isConnected: false,
    isHealthy: false,
    sessionsValid: false,
    tabsCount: 0,
    uptime: 0,
    memoryUsage: 0,
    lastCheck: new Date(),
    issues: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connector = ChromeConnector.getInstance();
  const healthMonitor = BrowserHealth.getInstance();
  const sessionMonitor = SessionMonitor.getInstance();
  const tabsManager = TabsManager.getInstance();

  const updateStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar conexão
      const isConnected = connector.getConnectionStatus();
      
      // Verificar saúde
      const healthStatus = healthMonitor.getStatus();
      
      // Verificar sessões
      const sessionStatus = sessionMonitor.getStatus();
      
      // Verificar abas
      const tabsCount = tabsManager.getTabCount();

      const newStatus: BrowserStatus = {
        isConnected,
        isHealthy: healthStatus.isChromeRunning && healthStatus.isCDPAvailable,
        sessionsValid: sessionStatus.overall.isValid,
        tabsCount,
        uptime: healthStatus.uptime,
        memoryUsage: healthStatus.memoryUsage,
        lastCheck: new Date(),
        issues: [
          ...(!isConnected ? ['Chrome não conectado'] : []),
          ...(!healthStatus.isChromeRunning ? ['Chrome não está rodando'] : []),
          ...(!healthStatus.isCDPAvailable ? ['CDP não disponível'] : []),
          ...sessionStatus.overall.issues
        ]
      };

      setStatus(newStatus);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao atualizar status do browser:', err);
    } finally {
      setLoading(false);
    }
  }, [connector, healthMonitor, sessionMonitor, tabsManager]);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await connector.connect();
      await healthMonitor.startMonitoring();
      await updateStatus();
      
      console.log('✅ Browser conectado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar';
      setError(errorMessage);
      console.error('❌ Erro ao conectar browser:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connector, healthMonitor, updateStatus]);

  const disconnect = useCallback(async () => {
    try {
      await connector.disconnect();
      healthMonitor.stopMonitoring();
      await updateStatus();
      
      console.log('🔌 Browser desconectado');
    } catch (err) {
      console.error('❌ Erro ao desconectar:', err);
      throw err;
    }
  }, [connector, healthMonitor, updateStatus]);

  const validateSessions = useCallback(async () => {
    try {
      setLoading(true);
      await sessionMonitor.validateAllSessions();
      await updateStatus();
      
      console.log('✅ Sessões validadas');
    } catch (err) {
      console.error('❌ Erro ao validar sessões:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionMonitor, updateStatus]);

  const cleanupTabs = useCallback(async () => {
    try {
      const closedCount = await tabsManager.cleanupTabs();
      await updateStatus();
      
      console.log(`🧹 ${closedCount} abas fechadas na limpeza`);
      return closedCount;
    } catch (err) {
      console.error('❌ Erro na limpeza de abas:', err);
      throw err;
    }
  }, [tabsManager, updateStatus]);

  const openTab = useCallback(async (url: string) => {
    try {
      const tab = await tabsManager.openTab(url);
      await updateStatus();
      
      console.log(`🔗 Aba aberta: ${tab.title}`);
      return tab;
    } catch (err) {
      console.error('❌ Erro ao abrir aba:', err);
      throw err;
    }
  }, [tabsManager, updateStatus]);

  const waitForHealthy = useCallback(async (timeout?: number) => {
    try {
      setLoading(true);
      await healthMonitor.waitForHealthy(timeout);
      await updateStatus();
      
      console.log('✅ Browser está saudável');
    } catch (err) {
      console.error('❌ Browser não ficou saudável:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [healthMonitor, updateStatus]);

  const forceReconnect = useCallback(async () => {
    try {
      setLoading(true);
      await connector.reconnect();
      await updateStatus();
      
      console.log('🔄 Reconexão forçada concluída');
    } catch (err) {
      console.error('❌ Erro na reconexão forçada:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connector, updateStatus]);

  // Auto-update periódico
  useEffect(() => {
    const interval = setInterval(() => {
      updateStatus();
    }, BrowserConfig.HEALTH_CHECK_INTERVAL);

    // Update inicial
    updateStatus();

    return () => clearInterval(interval);
  }, [updateStatus]);

  return {
    status,
    loading,
    error,
    actions: {
      connect,
      disconnect,
      validateSessions,
      cleanupTabs,
      openTab,
      waitForHealthy,
      forceReconnect,
      updateStatus
    }
  };
}

export function useBrowserHealth() {
  const [healthStatus, setHealthStatus] = useState(BrowserHealth.getInstance().getStatus());
  const healthMonitor = BrowserHealth.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      const status = healthMonitor.getStatus();
      setHealthStatus(status);
    }, BrowserConfig.HEALTH_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [healthMonitor]);

  return healthStatus;
}

export function useSessionMonitor() {
  const [sessionStatus, setSessionStatus] = useState(SessionMonitor.getInstance().getStatus());
  const sessionMonitor = SessionMonitor.getInstance();

  const validateSessions = useCallback(async () => {
    await sessionMonitor.validateAllSessions();
    setSessionStatus(sessionMonitor.getStatus());
  }, [sessionMonitor]);

  return {
    status: sessionStatus,
    validateSessions
  };
}

export function useTabsManager() {
  const [tabsCount, setTabsCount] = useState(0);
  const tabsManager = TabsManager.getInstance();

  const refreshTabs = useCallback(async () => {
    const tabs = await tabsManager.refreshTabs();
    setTabsCount(tabs.length);
    return tabs;
  }, [tabsManager]);

  const cleanupTabs = useCallback(async () => {
    const count = await tabsManager.cleanupTabs();
    setTabsCount(tabsManager.getTabCount());
    return count;
  }, [tabsManager]);

  useEffect(() => {
    refreshTabs();
  }, [refreshTabs]);

  return {
    tabsCount,
    refreshTabs,
    cleanupTabs,
    getTabsSummary: tabsManager.getTabsSummary.bind(tabsManager)
  };
}
