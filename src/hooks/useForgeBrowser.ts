import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ForgeBrowserManager, 
  ForgeBrowserConfig,
  BrowserHealthStatus,
  SessionValidationResult 
} from '../modules/browser/ForgeBrowserManager';
import { FacebookSessionValidator } from '../modules/browser/FacebookSessionValidator';

export interface ForgeBrowserHookState {
  isConnected: boolean;
  isHealthy: boolean;
  isConnecting: boolean;
  health: BrowserHealthStatus | null;
  error: string | null;
}

export interface ForgeBrowserActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  checkHealth: () => Promise<BrowserHealthStatus>;
  takeScreenshot: (name?: string) => Promise<string>;
  validateFacebookSession: () => Promise<SessionValidationResult>;
}

/**
 * Hook profissional para gerenciar browser CDP do ForgeDeals
 * Usa a nova arquitetura com profile isolado
 */
export function useForgeBrowser(config?: Partial<ForgeBrowserConfig>) {
  const managerRef = useRef(ForgeBrowserManager.getInstance(config));
  const validatorRef = useRef<FacebookSessionValidator | null>(null);
  
  const [state, setState] = useState<ForgeBrowserHookState>({
    isConnected: false,
    isHealthy: false,
    isConnecting: false,
    health: null,
    error: null
  });

  const updateState = useCallback(() => {
    const manager = managerRef.current;
    const health = manager.getHealthStatus();
    const isConnected = manager.isConnected();
    
    setState(prev => ({
      ...prev,
      isConnected,
      isHealthy: health?.isHealthy ?? false,
      health,
      error: null
    }));
  }, []);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const { page } = await managerRef.current.connect();
      
      // Inicializar validator com a página
      if (!validatorRef.current) {
        validatorRef.current = new FacebookSessionValidator();
      }
      validatorRef.current.setPage(page);
      
      updateState();
      console.log('✅ Browser conectado via CDP');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao conectar';
      setState(prev => ({ ...prev, error: message, isConnecting: false }));
      console.error('❌ Erro ao conectar:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [updateState]);

  const disconnect = useCallback(async () => {
    try {
      await managerRef.current.disconnect();
      validatorRef.current = null;
      updateState();
      console.log('🔌 Browser desconectado');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }, [updateState]);

  const reconnect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      await managerRef.current.reconnect();
      const { page } = managerRef.current.getInstances();
      if (page && validatorRef.current) {
        validatorRef.current.setPage(page);
      }
      updateState();
      console.log('🔄 Browser reconectado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reconectar';
      setState(prev => ({ ...prev, error: message, isConnecting: false }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [updateState]);

  const checkHealth = useCallback(async () => {
    try {
      const health = await managerRef.current.checkHealth();
      setState(prev => ({ ...prev, health, isHealthy: health.isHealthy }));
      return health;
    } catch (error) {
      console.error('❌ Erro no health check:', error);
      throw error;
    }
  }, []);

  const takeScreenshot = useCallback(async (name?: string) => {
    return managerRef.current.takeScreenshot(name);
  }, []);

  const validateFacebookSession = useCallback(async () => {
    if (!validatorRef.current) {
      const { page } = managerRef.current.getInstances();
      if (!page) {
        throw new Error('Página não disponível');
      }
      validatorRef.current = new FacebookSessionValidator(page);
    }
    return validatorRef.current.validate();
  }, []);

  // Health check automático
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isConnected) {
        checkHealth().catch(() => {
          // Ignora erro silenciosamente
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [state.isConnected, checkHealth]);

  // Update inicial
  useEffect(() => {
    updateState();
  }, [updateState]);

  const actions: ForgeBrowserActions = {
    connect,
    disconnect,
    reconnect,
    checkHealth,
    takeScreenshot,
    validateFacebookSession
  };

  return {
    ...state,
    actions,
    manager: managerRef.current
  };
}

/**
 * Hook simplificado para apenas verificar status
 */
export function useForgeBrowserStatus() {
  const manager = useRef(ForgeBrowserManager.getInstance());
  const [status, setStatus] = useState<BrowserHealthStatus | null>(null);

  useEffect(() => {
    const update = () => {
      setStatus(manager.current.getHealthStatus());
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
