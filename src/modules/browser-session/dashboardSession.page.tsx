import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Globe,
  Chrome,
  Shield,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Settings,
  User,
  Cookie,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
  Database,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Lock,
  Unlock,
  Monitor as BrowserIcon,
  Cpu,
  HardDrive,
  Timer,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Importar classes (simuladas para este exemplo)
// import { BrowserSessionManager, SessionStatus, SessionMetrics } from './browserSessionManager';
// import { ProfileDetector, BrowserInfo, ProfileInfo } from './profileDetector';
// import { SessionHealth } from './sessionHealth';

// Interfaces simuladas para este exemplo
interface SessionStatus {
  browserActive: boolean;
  profileLoaded: boolean;
  sessionValid: boolean;
  authenticationStatus: 'authenticated' | 'not_authenticated' | 'expired' | 'unknown';
  lastActivity: string;
  uptime: number;
  activePages: number;
  cookiesCount: number;
  errors: string[];
}

interface SessionMetrics {
  totalSessions: number;
  successfulLogins: number;
  failedLogins: number;
  averageSessionTime: number;
  mostUsedBrowser: string;
  sessionStability: number;
  lastHealthCheck: string;
}

interface BrowserInfo {
  type: 'chrome' | 'edge' | 'brave';
  name: string;
  executablePath: string;
  version?: string;
  isInstalled: boolean;
  isDefault?: boolean;
}

interface ProfileInfo {
  name: string;
  directory: string;
  isDefault: boolean;
  lastUsed: Date;
  size: number;
  userDataPath: string;
}

// Classes simuladas para este exemplo
class BrowserSessionManager {
  async getSessionStatus(): Promise<SessionStatus> {
    return {
      browserActive: false,
      profileLoaded: false,
      sessionValid: false,
      authenticationStatus: 'unknown',
      lastActivity: new Date().toISOString(),
      uptime: 0,
      activePages: 0,
      cookiesCount: 0,
      errors: []
    };
  }

  getSessionMetrics(): SessionMetrics {
    return {
      totalSessions: 0,
      successfulLogins: 0,
      failedLogins: 0,
      averageSessionTime: 0,
      mostUsedBrowser: 'chrome',
      sessionStability: 100,
      lastHealthCheck: new Date().toISOString()
    };
  }

  async startPersistentSession(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async closeSession(): Promise<void> {
    // Simulação
  }

  async restartSession(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

class ProfileDetector {
  async detectAvailableBrowsers(): Promise<Record<string, BrowserInfo>> {
    return {
      chrome: {
        type: 'chrome',
        name: 'Google Chrome',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        version: '120.0.0.0',
        isInstalled: true,
        isDefault: true
      },
      edge: {
        type: 'edge',
        name: 'Microsoft Edge',
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        version: '120.0.0.0',
        isInstalled: true,
        isDefault: false
      },
      brave: {
        type: 'brave',
        name: 'Brave Browser',
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        version: '1.61.109',
        isInstalled: true,
        isDefault: false
      }
    };
  }
}

class SessionHealth {
  // Simulação
}

export const SessionDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'browsers' | 'profiles' | 'health' | 'settings'>('overview');
  const [sessionManager] = useState(new BrowserSessionManager());
  const [profileDetector] = useState(new ProfileDetector());
  const [sessionHealth] = useState(new SessionHealth());
  
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [availableBrowsers, setAvailableBrowsers] = useState<Record<string, BrowserInfo>>({});
  const [selectedBrowser, setSelectedBrowser] = useState<string>('chrome');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadInitialData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadSessionStatus();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAvailableBrowsers(),
        loadSessionStatus(),
        loadSessionMetrics()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableBrowsers = async () => {
    const browsers = await profileDetector.detectAvailableBrowsers();
    setAvailableBrowsers(browsers);
  };

  const loadSessionStatus = async () => {
    try {
      const status = await sessionManager.getSessionStatus();
      setSessionStatus(status);
    } catch (error) {
      console.error('Error loading session status:', error);
    }
  };

  const loadSessionMetrics = async () => {
    try {
      const metrics = sessionManager.getSessionMetrics();
      setSessionMetrics(metrics);
    } catch (error) {
      console.error('Error loading session metrics:', error);
    }
  };

  const startSession = async () => {
    setIsLoading(true);
    try {
      const result = await sessionManager.startPersistentSession();
      
      if (result.success) {
        await loadSessionStatus();
        await loadSessionMetrics();
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    setIsLoading(true);
    try {
      await sessionManager.closeSession();
      await loadSessionStatus();
      await loadSessionMetrics();
    } catch (error) {
      console.error('Error stopping session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const restartSession = async () => {
    setIsLoading(true);
    try {
      const result = await sessionManager.restartSession();
      
      if (result.success) {
        await loadSessionStatus();
        await loadSessionMetrics();
      }
    } catch (error) {
      console.error('Error restarting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <BrowserIcon className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-400">Status</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {sessionStatus?.browserActive ? 'Ativo' : 'Inativo'}
          </div>
          <div className="text-sm text-gray-400">Navegador</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <User className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-400">Perfil</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {sessionStatus?.profileLoaded ? 'Carregado' : 'Não'}
          </div>
          <div className="text-sm text-gray-400">Sessão</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-400">Auth</span>
          </div>
          <div className="text-2xl font-bold text-white capitalize">
            {sessionStatus?.authenticationStatus || 'Unknown'}
          </div>
          <div className="text-sm text-gray-400">Autenticação</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-400">Uptime</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatUptime(sessionStatus?.uptime || 0)}
          </div>
          <div className="text-sm text-gray-400">Tempo Ativo</div>
        </div>
      </div>

      {/* Session Details */}
      {sessionStatus && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Detalhes da Sessão
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Navegador Ativo</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  sessionStatus.browserActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {sessionStatus.browserActive ? 'Sim' : 'Não'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Perfil Carregado</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  sessionStatus.profileLoaded ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {sessionStatus.profileLoaded ? 'Sim' : 'Não'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sessão Válida</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  sessionStatus.sessionValid ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {sessionStatus.sessionValid ? 'Sim' : 'Não'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Autenticação</span>
                <span className={`px-2 py-1 rounded text-xs capitalize ${
                  sessionStatus.authenticationStatus === 'authenticated' ? 'bg-green-500/20 text-green-500' :
                  sessionStatus.authenticationStatus === 'not_authenticated' ? 'bg-red-500/20 text-red-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {sessionStatus.authenticationStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Páginas Ativas</span>
                <span className="text-white font-medium">{sessionStatus.activePages}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cookies</span>
                <span className="text-white font-medium">{sessionStatus.cookiesCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Última Atividade</span>
                <span className="text-white font-medium">
                  {new Date(sessionStatus.lastActivity).toLocaleTimeString('pt-BR')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Erros</span>
                <span className={`font-medium ${
                  sessionStatus.errors.length > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {sessionStatus.errors.length}
                </span>
              </div>
            </div>
          </div>

          {sessionStatus.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-sm text-red-400 font-medium mb-2">Erros Detectados:</div>
              <div className="space-y-1">
                {sessionStatus.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-300">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={startSession}
            disabled={isLoading || sessionStatus?.browserActive}
            className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">Iniciar</span>
          </button>
          
          <button
            onClick={stopSession}
            disabled={isLoading || !sessionStatus?.browserActive}
            className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pause className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500">Parar</span>
          </button>

          <button
            onClick={restartSession}
            disabled={isLoading}
            className="flex items-center gap-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500">Reiniciar</span>
          </button>

          <button
            onClick={loadSessionStatus}
            disabled={isLoading}
            className="flex items-center gap-2 p-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Verificar</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrowsers = () => (
    <div className="space-y-6">
      {/* Browser Selection */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BrowserIcon className="w-5 h-5 text-accent" />
          Navegadores Disponíveis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(availableBrowsers).map(([type, info]) => (
            <div
              key={type}
              className={`bg-black/40 border rounded-lg p-4 cursor-pointer transition-all ${
                selectedBrowser === type 
                  ? 'border-accent bg-accent/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setSelectedBrowser(type)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {type === 'chrome' && <Chrome className="w-5 h-5 text-blue-500" />}
                  {type === 'edge' && <BrowserIcon className="w-5 h-5 text-blue-600" />}
                  {type === 'brave' && <BrowserIcon className="w-5 h-5 text-orange-500" />}
                  <span className="font-medium text-white capitalize">{type}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  info.isInstalled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {info.isInstalled ? 'Instalado' : 'Não'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Versão:</span>
                  <span className="text-white">{info.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Padrão:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    info.isDefault ? 'bg-accent/20 text-accent' : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {info.isDefault ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Caminho:</span>
                  <span className="text-white text-xs truncate max-w-[150px]" title={info.executablePath}>
                    {info.executablePath.split('\\').pop()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browser Actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Ações do Navegador</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Iniciar com Perfil Padrão</div>
              <div className="text-sm text-gray-400">Usa o perfil principal do navegador</div>
            </div>
            <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all">
              Iniciar
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Iniciar com Perfil Específico</div>
              <div className="text-sm text-gray-400">Selecionar perfil personalizado</div>
            </div>
            <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
              Selecionar
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Criar Novo Perfil</div>
              <div className="text-sm text-gray-400">Perfil limpo para ForgeDeals</div>
            </div>
            <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfiles = () => (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-accent" />
          Perfis do Navegador
        </h3>

        <div className="space-y-4">
          {/* Profile List */}
          <div className="space-y-3">
            {[
              {
                name: 'Default',
                isDefault: true,
                lastUsed: new Date(),
                size: 256,
                status: 'active'
              },
              {
                name: 'ForgeDeals',
                isDefault: false,
                lastUsed: new Date(Date.now() - 86400000),
                size: 128,
                status: 'inactive'
              },
              {
                name: 'Profile 1',
                isDefault: false,
                lastUsed: new Date(Date.now() - 172800000),
                size: 512,
                status: 'backup'
              }
            ].map((profile, index) => (
              <div key={index} className="bg-black/40 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {profile.name}
                        {profile.isDefault && (
                          <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Último uso: {profile.lastUsed.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      profile.status === 'active' ? 'bg-green-500/20 text-green-500' :
                      profile.status === 'inactive' ? 'bg-gray-500/20 text-gray-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {profile.status === 'active' ? 'Ativo' :
                       profile.status === 'inactive' ? 'Inativo' : 'Backup'}
                    </span>
                    <span className="text-sm text-gray-400">{profile.size} MB</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-all">
                    Usar
                  </button>
                  <button className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-all">
                    Backup
                  </button>
                  <button className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-sm hover:bg-red-500/30 transition-all">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Management */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Gerenciamento de Perfis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-white">Backup Automático</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Cria backups automáticos dos perfis ativos
            </p>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-400">Ativar backup diário</span>
            </label>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <HardDrive className="w-5 h-5 text-green-500" />
              <span className="font-medium text-white">Limpeza de Cache</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Remove arquivos temporários e otimiza espaço
            </p>
            <button className="px-3 py-1 bg-green-500/20 text-green-500 rounded text-sm hover:bg-green-500/30 transition-all">
              Limpar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Saúde da Sessão
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-400">Status Geral</span>
            </div>
            <div className="text-xl font-bold text-green-500">Saudável</div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-400">Cookies</span>
            </div>
            <div className="text-xl font-bold text-white">127</div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-400">Uptime</span>
            </div>
            <div className="text-xl font-bold text-white">2h 34m</div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-400">Estabilidade</span>
            </div>
            <div className="text-xl font-bold text-purple-500">98%</div>
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Verificações de Saúde</h4>
        <div className="space-y-3">
          {[
            { check: 'Autenticação Facebook', status: 'passed', lastCheck: '2 min atrás' },
            { check: 'Autenticação Loja do Mecânico', status: 'passed', lastCheck: '2 min atrás' },
            { check: 'Integridade de Cookies', status: 'passed', lastCheck: '5 min atrás' },
            { check: 'Conectividade de Rede', status: 'warning', lastCheck: '1 min atrás' },
            { check: 'Uso de Memória', status: 'passed', lastCheck: '3 min atrás' },
            { check: 'Taxa de Erros', status: 'passed', lastCheck: '5 min atrás' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                {item.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-white">{item.check}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{item.lastCheck}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'passed' ? 'bg-green-500/20 text-green-500' :
                  item.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {item.status === 'passed' ? 'OK' :
                   item.status === 'warning' ? 'Atenção' : 'Falha'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Metrics */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Métricas de Performance</h4>
        <div className="space-y-4">
          {[
            { metric: 'Tempo de Carregamento', value: '1.2s', trend: 'down', status: 'good' },
            { metric: 'Taxa de Sucesso', value: '98.5%', trend: 'up', status: 'good' },
            { metric: 'Erros de Rede', value: '0.3%', trend: 'down', status: 'good' },
            { metric: 'Uso de Memória', value: '245 MB', trend: 'stable', status: 'warning' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-400">{item.metric}</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{item.value}</span>
                {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {item.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />}
                {item.trend === 'stable' && <div className="w-4 h-4 bg-yellow-500 rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          Configurações Gerais
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Modo Headless</div>
              <div className="text-sm text-gray-400">Executar navegador sem interface gráfica</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Auto Refresh</div>
              <div className="text-sm text-gray-400">Atualizar status automaticamente</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Monitoramento de Saúde</div>
              <div className="text-sm text-gray-400">Verificar saúde da sessão continuamente</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="font-bold text-white mb-4">Configurações Avançadas</h4>
        <div className="space-y-4">
          <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
            <div className="font-medium text-white mb-2">Timeout de Carregamento</div>
            <input 
              type="number" 
              defaultValue="30" 
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
            <div className="text-sm text-gray-400 mt-1">Segundos</div>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
            <div className="font-medium text-white mb-2">Viewport Padrão</div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                defaultValue="1920" 
                placeholder="Largura"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <input 
                type="number" 
                defaultValue="1080" 
                placeholder="Altura"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
            <div className="font-medium text-white mb-2">User Agent</div>
            <textarea 
              defaultValue="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-20 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  };

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Session Manager</h1>
          <p className="text-gray-400">Gerenciamento de sessões persistentes do navegador</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              autoRefresh ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 mb-6">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Monitor },
          { id: 'browsers', label: 'Navegadores', icon: BrowserIcon },
          { id: 'profiles', label: 'Perfis', icon: User },
          { id: 'health', label: 'Saúde', icon: Activity },
          { id: 'settings', label: 'Configurações', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'browsers' && renderBrowsers()}
            {activeTab === 'profiles' && renderProfiles()}
            {activeTab === 'health' && renderHealth()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Configurações da Sessão</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Navegador Padrão</h4>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                    <option value="chrome">Google Chrome</option>
                    <option value="edge">Microsoft Edge</option>
                    <option value="brave">Brave Browser</option>
                  </select>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Perfil Padrão</h4>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                    <option value="default">Default</option>
                    <option value="forgedeals">ForgeDeals</option>
                    <option value="profile1">Profile 1</option>
                  </select>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Intervalo de Verificação</h4>
                  <input 
                    type="number" 
                    defaultValue="30" 
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                  <div className="text-sm text-gray-400 mt-1">Segundos entre verificações automáticas</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
