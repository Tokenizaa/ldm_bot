import { Browser, BrowserContext, Page } from 'playwright';
import { ProfileDetector } from './profileDetector';
import { PersistentContext } from './persistentContext';
import { SessionHealth } from './sessionHealth';
import { BrowserLauncher } from './browserLauncher';
import { defaultBrowserConfig } from '../../config/browserConfig';

export interface BrowserConfig {
  browserType: 'chrome' | 'edge' | 'brave';
  profileName?: string;
  profileDirectory?: string;
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  extraArgs?: string[];
}

export interface SessionStatus {
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

export interface SessionMetrics {
  totalSessions: number;
  successfulLogins: number;
  failedLogins: number;
  averageSessionTime: number;
  mostUsedBrowser: string;
  sessionStability: number;
  lastHealthCheck: string;
}

export class BrowserSessionManager {
  private profileDetector: ProfileDetector;
  private persistentContext: PersistentContext;
  private sessionHealth: SessionHealth;
  private browserLauncher: BrowserLauncher;
  
  private activeBrowser: Browser | null = null;
  private activeContext: BrowserContext | null = null;
  private activePages: Map<string, Page> = new Map();
  
  private config: BrowserConfig;
  private sessionStartTime: Date | null = null;
  private lastActivity: Date = new Date();
  private sessionMetrics: SessionMetrics;

  constructor(config: Partial<BrowserConfig> = {}) {
    // Usar configuração global como padrão
    this.config = {
      ...defaultBrowserConfig,
      // Permitir override de configurações específicas
      ...config
    };

    this.profileDetector = new ProfileDetector();
    this.persistentContext = new PersistentContext();
    this.sessionHealth = new SessionHealth();
    this.browserLauncher = new BrowserLauncher();

    this.sessionMetrics = {
      totalSessions: 0,
      successfulLogins: 0,
      failedLogins: 0,
      averageSessionTime: 0,
      mostUsedBrowser: this.config.browserType,
      sessionStability: 100,
      lastHealthCheck: new Date().toISOString()
    };
  }

  /**
   * Inicia sessão persistente do navegador
   */
  async startPersistentSession(): Promise<{
    success: boolean;
    browser: Browser | null;
    context: BrowserContext | null;
    error?: string;
  }> {
    try {
      console.log('🚀 Iniciando sessão persistente com configuração global...');
      console.log(`📋 Browser: ${this.config.browserType}`);
      console.log(`👤 Profile: ${this.config.profileName || 'Default'}`);
      console.log(`🖥️  Headless: ${this.config.headless}`);

      // 1. Usar perfil padrão do Windows Chrome se não especificado
      if (!this.config.profileDirectory) {
        const profileInfo = this.getDefaultWindowsProfile();
        this.config.profileDirectory = profileInfo.directory;
        this.config.profileName = profileInfo.name;
      }

      // 2. Iniciar diretamente com launchPersistentContext para Windows Chrome
      const userDataDir = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data';
      
      const context = await require('playwright').chromium.launchPersistentContext(
        userDataDir,
        {
          channel: 'chrome',
          headless: this.config.headless || false, // MUITO IMPORTANTE: headless false
          args: [
            `--profile-directory=${this.config.profileName || 'Profile 1'}`,
            ...(this.config.extraArgs || [])
          ],
          viewport: this.config.viewport
        }
      );

      this.activeContext = context;
      this.activeBrowser = context as any; // Context funciona como Browser para cleanup
      this.sessionStartTime = new Date();
      this.sessionMetrics.totalSessions++;

      // 3. Configurar monitoramento de saúde
      await this.sessionHealth.startMonitoring(context, {
        onLogout: () => this.handleLogout(),
        onCookieExpiry: () => this.handleCookieExpiry(),
        onCaptcha: () => this.handleCaptcha(),
        onCheckpoint: () => this.handleCheckpoint(),
        onLoadFailure: (error) => this.handleLoadFailure(error)
      });

      // 4. Verificar autenticação inicial
      const authStatus = await this.verifyAuthentication();
      
      this.updateLastActivity();
      
      console.log('✅ Sessão persistente iniciada com sucesso!');
      
      return {
        success: true,
        browser: this.activeBrowser,
        context
      };

    } catch (error) {
      console.error('❌ Error starting persistent session:', error);
      this.sessionMetrics.failedLogins++;
      
      return {
        success: false,
        browser: null,
        context: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtém perfil padrão do Windows Chrome
   */
  private getDefaultWindowsProfile(): {
    name: string;
    directory: string;
  } {
    return {
      name: 'Profile 1',
      directory: 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1'
    };
  }

  /**
   * Seleciona perfil do usuário
   */
  private async selectUserProfile(browserInfo: any): Promise<{
    profileDirectory: string;
    profileName: string;
  }> {
    // Se perfil específico foi configurado, usar ele
    if (this.config.profileDirectory && this.config.profileName) {
      return {
        profileDirectory: this.config.profileDirectory,
        profileName: this.config.profileName
      };
    }

    // Detectar perfis disponíveis
    const profiles = await this.profileDetector.detectProfiles(browserInfo.executablePath);
    
    if (profiles.length === 0) {
      throw new Error('Nenhum perfil encontrado');
    }

    // Selecionar perfil mais recente ou padrão
    const selectedProfile = profiles.find(p => p.isDefault) || profiles[0];
    
    return {
      profileDirectory: selectedProfile.directory,
      profileName: selectedProfile.name
    };
  }

  /**
   * Verifica status de autenticação
   */
  async verifyAuthentication(): Promise<'authenticated' | 'not_authenticated' | 'expired' | 'unknown'> {
    if (!this.activeContext) return 'unknown';

    try {
      // Verificar autenticação no Facebook
      const facebookPage = await this.activeContext.newPage();
      await facebookPage.goto('https://www.facebook.com', { waitUntil: 'networkidle' });
      
      const isAuthenticated = await facebookPage.evaluate(() => {
        // Verificar se está logado no Facebook
        const loginButton = document.querySelector('[data-testid="royal_login_button"]');
        const profileButton = document.querySelector('[aria-label="Account"]');
        return !loginButton && !!profileButton;
      });

      await facebookPage.close();

      if (isAuthenticated) {
        this.sessionMetrics.successfulLogins++;
        return 'authenticated';
      }

      return 'not_authenticated';

    } catch (error) {
      console.error('Error verifying authentication:', error);
      return 'unknown';
    }
  }

  /**
   * Obtém status atual da sessão
   */
  async getSessionStatus(): Promise<SessionStatus> {
    const currentTime = new Date();
    const uptime = this.sessionStartTime ? 
      Math.floor((currentTime.getTime() - this.sessionStartTime.getTime()) / 1000) : 0;

    let cookiesCount = 0;
    let activePagesCount = 0;
    let errors: string[] = [];

    if (this.activeContext) {
      try {
        const cookies = await this.activeContext.cookies();
        cookiesCount = cookies.length;
        
        const pages = this.activeContext.pages();
        activePagesCount = pages.length;
        
        // Verificar erros nas páginas
        for (const page of pages) {
          if (page.isClosed()) {
            errors.push(`Página ${page.url()} foi fechada inesperadamente`);
          }
        }
      } catch (error) {
        errors.push(`Erro ao verificar contexto: ${error}`);
      }
    }

    const authenticationStatus = await this.verifyAuthentication();

    return {
      browserActive: !!this.activeBrowser && !this.activeBrowser.isConnected(),
      profileLoaded: !!this.activeContext,
      sessionValid: this.sessionStartTime !== null,
      authenticationStatus,
      lastActivity: this.lastActivity.toISOString(),
      uptime,
      activePages: activePagesCount,
      cookiesCount,
      errors
    };
  }

  /**
   * Cria nova página na sessão persistente
   */
  async createPage(options?: {
    url?: string;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  }): Promise<Page | null> {
    if (!this.activeContext) {
      throw new Error('Sessão não iniciada. Use startPersistentSession() primeiro.');
    }

    try {
      const page = await this.activeContext.newPage();
      
      // Configurar viewport se especificado
      if (this.config.viewport) {
        await page.setViewportSize(this.config.viewport);
      }

      // Navegar para URL se especificado
      if (options?.url) {
        await page.goto(options.url, {
          waitUntil: options.waitUntil || 'networkidle',
          timeout: options.timeout || 30000
        });
      }

      // Adicionar à lista de páginas ativas
      const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.activePages.set(pageId, page);

      // Limpar quando a página for fechada
      page.on('close', () => {
        this.activePages.delete(pageId);
      });

      this.updateLastActivity();
      
      return page;

    } catch (error) {
      console.error('Error creating page:', error);
      return null;
    }
  }

  /**
   * Navega para URL em página existente ou nova
   */
  async navigateTo(url: string, options?: {
    pageId?: string;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  }): Promise<Page | null> {
    try {
      let page: Page | null = null;

      // Se pageId especificado, usar página existente
      if (options?.pageId) {
        const existingPage = Array.from(this.activePages.values())
          .find(p => !p.isClosed());
        
        if (existingPage) {
          page = existingPage;
        }
      }

      // Se não encontrar página, criar nova
      if (!page) {
        page = await this.createPage();
      }

      if (!page) return null;

      await page.goto(url, {
        waitUntil: options?.waitUntil || 'networkidle',
        timeout: options?.timeout || 30000
      });

      this.updateLastActivity();
      
      return page;

    } catch (error) {
      console.error('Error navigating to URL:', error);
      return null;
    }
  }

  /**
   * Verifica saúde da sessão
   */
  async checkSessionHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    if (!this.activeContext) {
      return {
        healthy: false,
        issues: ['Sessão não iniciada'],
        recommendations: ['Inicie uma sessão persistente']
      };
    }

    return await this.sessionHealth.performHealthCheck(this.activeContext);
  }

  /**
   * Reinicia sessão mantendo o perfil
   */
  async restartSession(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Salvar configuração atual
      const currentConfig = { ...this.config };
      
      // Fechar sessão atual
      await this.closeSession();
      
      // Pequena pausa para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reiniciar com mesma configuração
      const result = await this.startPersistentSession();
      
      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      console.error('Error restarting session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fecha sessão e navegador
   */
  async closeSession(): Promise<void> {
    try {
      // Fechar todas as páginas
      for (const page of this.activePages.values()) {
        if (!page.isClosed()) {
          await page.close();
        }
      }
      this.activePages.clear();

      // Parar monitoramento de saúde
      await this.sessionHealth.stopMonitoring();

      // Fechar contexto
      if (this.activeContext) {
        await this.activeContext.close();
        this.activeContext = null;
      }

      // Fechar navegador
      if (this.activeBrowser) {
        await this.activeBrowser.close();
        this.activeBrowser = null;
      }

      // Atualizar métricas
      if (this.sessionStartTime) {
        const sessionTime = Math.floor(
          (new Date().getTime() - this.sessionStartTime.getTime()) / 1000
        );
        
        const totalSessions = this.sessionMetrics.totalSessions;
        this.sessionMetrics.averageSessionTime = 
          ((this.sessionMetrics.averageSessionTime * (totalSessions - 1)) + sessionTime) / totalSessions;
      }

      this.sessionStartTime = null;

    } catch (error) {
      console.error('Error closing session:', error);
    }
  }

  /**
   * Atualiza configuração da sessão
   */
  updateConfig(newConfig: Partial<BrowserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém métricas da sessão
   */
  getSessionMetrics(): SessionMetrics {
    return {
      ...this.sessionMetrics,
      lastHealthCheck: new Date().toISOString()
    };
  }

  /**
   * Exporta dados da sessão
   */
  exportSessionData(): {
    config: BrowserConfig;
    status: SessionStatus;
    metrics: SessionMetrics;
    activePages: Array<{ id: string; url: string; title: string }>;
  } {
    const activePagesInfo = Array.from(this.activePages.entries()).map(([id, page]) => ({
      id,
      url: page.url(),
      title: page.title()
    }));

    return {
      config: this.config,
      status: {
        browserActive: !!this.activeBrowser,
        profileLoaded: !!this.activeContext,
        sessionValid: this.sessionStartTime !== null,
        authenticationStatus: 'unknown',
        lastActivity: this.lastActivity.toISOString(),
        uptime: this.sessionStartTime ? 
          Math.floor((new Date().getTime() - this.sessionStartTime.getTime()) / 1000) : 0,
        activePages: this.activePages.size,
        cookiesCount: 0,
        errors: []
      },
      metrics: this.getSessionMetrics(),
      activePages: activePagesInfo
    };
  }

  // Event Handlers

  private handleLogout(): void {
    console.warn('Session logout detected');
    this.sessionMetrics.successfulLogins--;
    
    // Poderia implementar reconexão automática aqui
  }

  private handleCookieExpiry(): void {
    console.warn('Cookie expiry detected');
    // Poderia implementar refresh de cookies
  }

  private handleCaptcha(): void {
    console.warn('Captcha detected - manual intervention required');
    // Poderia pausar operações e notificar usuário
  }

  private handleCheckpoint(): void {
    console.warn('Facebook security checkpoint detected');
    // Poderia notificar usuário para verificação manual
  }

  private handleLoadFailure(error: Error): void {
    console.error('Page load failure:', error);
    // Poderia implementar retry logic
  }

  private updateLastActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Verifica se sessão está ativa e saudável
   */
  isSessionHealthy(): boolean {
    return !!this.activeBrowser && 
           !!this.activeContext && 
           !this.activeBrowser.isConnected() &&
           this.sessionStartTime !== null;
  }

  /**
   * Obtém navegador ativo
   */
  getActiveBrowser(): Browser | null {
    return this.activeBrowser;
  }

  /**
   * Obtém contexto ativo
   */
  getActiveContext(): BrowserContext | null {
    return this.activeContext;
  }

  /**
   * Obtém páginas ativas
   */
  getActivePages(): Page[] {
    return Array.from(this.activePages.values()).filter(page => !page.isClosed());
  }

  /**
   * Limpa recursos
   */
  async cleanup(): Promise<void> {
    await this.closeSession();
  }
}
