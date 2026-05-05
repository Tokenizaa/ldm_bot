import { BrowserContext, Page } from 'playwright';

export interface HealthCheckResult {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  metrics: HealthMetrics;
}

export interface HealthMetrics {
  sessionAge: number;
  pageLoadTime: number;
  errorCount: number;
  cookieCount: number;
  localStorageSize: number;
  memoryUsage: number;
  networkErrorRate: number;
  authenticationScore: number;
}

export interface HealthCheckOptions {
  onLogout?: () => void;
  onCookieExpiry?: () => void;
  onCaptcha?: () => void;
  onCheckpoint?: () => void;
  onLoadFailure?: (error: Error) => void;
  checkInterval?: number;
  maxRetries?: number;
}

export interface SessionEvent {
  type: 'logout' | 'cookie_expiry' | 'captcha' | 'checkpoint' | 'load_failure' | 'health_check';
  timestamp: Date;
  details: any;
}

export class SessionHealth {
  private context: BrowserContext | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventHandlers: HealthCheckOptions = {};
  private healthHistory: SessionEvent[] = [];
  private metrics: HealthMetrics;
  private isMonitoring: boolean = false;

  constructor() {
    this.metrics = {
      sessionAge: 0,
      pageLoadTime: 0,
      errorCount: 0,
      cookieCount: 0,
      localStorageSize: 0,
      memoryUsage: 0,
      networkErrorRate: 0,
      authenticationScore: 100
    };
  }

  /**
   * Inicia monitoramento de saúde da sessão
   */
  async startMonitoring(context: BrowserContext, options: HealthCheckOptions = {}): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Health monitoring already started');
      return;
    }

    this.context = context;
    this.eventHandlers = {
      checkInterval: 30000, // 30 segundos
      maxRetries: 3,
      ...options
    };

    // Configurar eventos do contexto
    await this.setupContextEvents();

    // Iniciar monitoramento periódico
    this.startPeriodicCheck();

    // Realizar primeira verificação
    await this.performHealthCheck();

    this.isMonitoring = true;
    console.log('Session health monitoring started');
  }

  /**
   * Para monitoramento de saúde
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('Session health monitoring stopped');
  }

  /**
   * Realiza verificação completa de saúde
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    if (!this.context) {
      return {
        healthy: false,
        issues: ['No active context'],
        recommendations: ['Start a new session'],
        metrics: this.metrics
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let healthy = true;

    try {
      // 1. Verificar se o contexto está conectado
      if (!this.context.browser().isConnected()) {
        issues.push('Browser context is disconnected');
        recommendations.push('Restart browser session');
        healthy = false;
      }

      // 2. Verificar páginas ativas
      const pages = this.context.pages();
      if (pages.length === 0) {
        issues.push('No active pages');
        recommendations.push('Create at least one page');
        healthy = false;
      }

      // 3. Verificar cookies
      const cookies = await this.context.cookies();
      this.metrics.cookieCount = cookies.length;
      
      // Verificar se há cookies essenciais
      const essentialCookies = ['c_user', 'xs', 'datr']; // Facebook cookies
      const hasEssentialCookies = essentialCookies.some(cookie =>
        cookies.some(c => c.name.includes(cookie))
      );

      if (!hasEssentialCookies) {
        issues.push('Missing essential authentication cookies');
        recommendations.push('Re-authenticate session');
        healthy = false;
      }

      // 4. Verificar autenticação em páginas
      for (const page of pages) {
        if (page.url().includes('facebook.com')) {
          const authStatus = await this.checkFacebookAuthentication(page);
          if (!authStatus.authenticated) {
            issues.push('Facebook authentication lost');
            recommendations.push('Re-login to Facebook');
            healthy = false;
            this.metrics.authenticationScore = 0;
          } else {
            this.metrics.authenticationScore = Math.max(this.metrics.authenticationScore, 75);
          }
        }

        if (page.url().includes('lojadomecanico.com.br')) {
          const authStatus = await this.checkLojaDoMecanicoAuthentication(page);
          if (!authStatus.authenticated) {
            issues.push('Loja do Mecânico authentication lost');
            recommendations.push('Re-login to Loja do Mecânico');
            healthy = false;
          }
        }
      }

      // 5. Verificar erros recentes
      const recentErrors = this.getRecentErrors();
      this.metrics.errorCount = recentErrors.length;
      
      if (recentErrors.length > 5) {
        issues.push('High error rate detected');
        recommendations.push('Check page stability and network connection');
        healthy = false;
      }

      // 6. Verificar uso de memória
      const memoryUsage = await this.checkMemoryUsage();
      this.metrics.memoryUsage = memoryUsage;
      
      if (memoryUsage > 500) { // 500MB
        issues.push('High memory usage');
        recommendations.push('Restart session to free memory');
        healthy = false;
      }

      // 7. Verificar taxa de erros de rede
      const networkErrorRate = this.calculateNetworkErrorRate();
      this.metrics.networkErrorRate = networkErrorRate;
      
      if (networkErrorRate > 0.1) { // 10%
        issues.push('High network error rate');
        recommendations.push('Check network connectivity');
        healthy = false;
      }

      // 8. Atualizar métricas de idade da sessão
      if (this.healthHistory.length > 0) {
        const firstEvent = this.healthHistory[0];
        this.metrics.sessionAge = Date.now() - firstEvent.timestamp.getTime();
      }

    } catch (error) {
      console.error('Error during health check:', error);
      issues.push('Health check failed');
      recommendations.push('Restart monitoring');
      healthy = false;
    }

    // Registrar evento de verificação
    this.addEvent({
      type: 'health_check',
      timestamp: new Date(),
      details: { healthy, issues, metrics: this.metrics }
    });

    return {
      healthy,
      issues,
      recommendations,
      metrics: this.metrics
    };
  }

  /**
   * Configura eventos do contexto
   */
  private async setupContextEvents(): Promise<void> {
    if (!this.context) return;

    // Evento de nova página
    this.context.on('page', (page) => {
      this.setupPageEvents(page);
    });

    // Configurar eventos para páginas existentes
    const pages = this.context.pages();
    for (const page of pages) {
      this.setupPageEvents(page);
    }
  }

  /**
   * Configura eventos de uma página específica
   */
  private setupPageEvents(page: Page): void {
    // Evento de console (erros JavaScript)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.addEvent({
          type: 'load_failure',
          timestamp: new Date(),
          details: { url: page.url(), error: msg.text() }
        });

        if (this.eventHandlers.onLoadFailure) {
          this.eventHandlers.onLoadFailure(new Error(msg.text()));
        }
      }
    });

    // Evento de erro de página
    page.on('pageerror', (error) => {
      this.addEvent({
        type: 'load_failure',
        timestamp: new Date(),
        details: { url: page.url(), error: error.message }
      });

      if (this.eventHandlers.onLoadFailure) {
        this.eventHandlers.onLoadFailure(error);
      }
    });

    // Evento de popup (verificar se é captcha ou checkpoint)
    page.on('popup', (popup) => {
      this.handlePopup(popup);
    });

    // Evento de resposta (verificar redirecionamentos)
    page.on('response', (response) => {
      this.handleResponse(response);
    });

    // Evento de request (verificar falhas de rede)
    page.on('requestfailed', (request) => {
      this.addEvent({
        type: 'load_failure',
        timestamp: new Date(),
        details: { url: request.url(), error: request.failure()?.errorText }
      });
    });
  }

  /**
   * Verifica autenticação no Facebook
   */
  private async checkFacebookAuthentication(page: Page): Promise<{ authenticated: boolean; details: any }> {
    try {
      const result = await page.evaluate(() => {
        // Verificar se está logado
        const loginButton = document.querySelector('[data-testid="royal_login_button"]');
        const profileButton = document.querySelector('[aria-label="Account"]');
        const homeLink = document.querySelector('[href*="/home"]');
        
        // Verificar cookies de autenticação
        const cookies = document.cookie.split(';').map(c => c.trim());
        const hasAuthCookies = cookies.some(c => 
          c.startsWith('c_user=') || c.startsWith('xs=') || c.startsWith('datr=')
        );

        // Verificar elementos específicos de usuário logado
        const userMenu = document.querySelector('[role="navigation"]');
        const notifications = document.querySelector('[aria-label="Notifications"]');

        return {
          authenticated: !loginButton && !!profileButton && hasAuthCookies,
          hasLoginButton: !!loginButton,
          hasProfileButton: !!profileButton,
          hasAuthCookies,
          hasHomeLink: !!homeLink,
          hasUserMenu: !!userMenu,
          hasNotifications: !!notifications,
          url: window.location.href
        };
      });

      return result;

    } catch (error) {
      console.error('Error checking Facebook authentication:', error);
      return { authenticated: false, details: { error: error.message } };
    }
  }

  /**
   * Verifica autenticação na Loja do Mecânico
   */
  private async checkLojaDoMecanicoAuthentication(page: Page): Promise<{ authenticated: boolean; details: any }> {
    try {
      const result = await page.evaluate(() => {
        // Verificar se está logado
        const loginButton = document.querySelector('a[href*="/login"]');
        const logoutButton = document.querySelector('a[href*="/logout"]');
        const userArea = document.querySelector('.user-area, .logged-user, .account-info');
        
        // Verificar elementos específicos de usuário logado
        const myAccount = document.querySelector('a[href*="/minha-conta"]');
        const orders = document.querySelector('a[href*="/meus-pedidos"]');

        return {
          authenticated: !loginButton && !!logoutButton,
          hasLoginButton: !!loginButton,
          hasLogoutButton: !!logoutButton,
          hasUserArea: !!userArea,
          hasMyAccount: !!myAccount,
          hasOrders: !!orders,
          url: window.location.href
        };
      });

      return result;

    } catch (error) {
      console.error('Error checking Loja do Mecânico authentication:', error);
      return { authenticated: false, details: { error: error.message } };
    }
  }

  /**
   * Lida com popups (captcha, checkpoint, etc.)
   */
  private async handlePopup(popup: Page): Promise<void> {
    try {
      await popup.waitForLoadState('networkidle', { timeout: 5000 });

      const popupUrl = popup.url();
      
      if (popupUrl.includes('checkpoint') || popupUrl.includes('security')) {
        this.addEvent({
          type: 'checkpoint',
          timestamp: new Date(),
          details: { url: popupUrl }
        });

        if (this.eventHandlers.onCheckpoint) {
          this.eventHandlers.onCheckpoint();
        }
      }

      if (popupUrl.includes('captcha') || popupUrl.includes('recaptcha')) {
        this.addEvent({
          type: 'captcha',
          timestamp: new Date(),
          details: { url: popupUrl }
        });

        if (this.eventHandlers.onCaptcha) {
          this.eventHandlers.onCaptcha();
        }
      }

      // Fechar popup automaticamente após análise
      setTimeout(() => {
        if (!popup.isClosed()) {
          popup.close();
        }
      }, 2000);

    } catch (error) {
      console.error('Error handling popup:', error);
    }
  }

  /**
   * Lida com respostas HTTP
   */
  private handleResponse(response: any): void {
    const url = response.url();
    const status = response.status();

    // Verificar redirecionamentos para login
    if (status === 302 || status === 301) {
      const location = response.headers()['location'] || response.headers()['Location'];
      
      if (location && location.includes('/login')) {
        this.addEvent({
          type: 'logout',
          timestamp: new Date(),
          details: { originalUrl: url, redirectUrl: location }
        });

        if (this.eventHandlers.onLogout) {
          this.eventHandlers.onLogout();
        }
      }
    }

    // Verificar erros de autenticação
    if (status === 401 || status === 403) {
      this.addEvent({
        type: 'logout',
        timestamp: new Date(),
        details: { url, status }
      });

      if (this.eventHandlers.onLogout) {
        this.eventHandlers.onLogout();
      }
    }

    // Verificar erros de servidor
    if (status >= 500) {
      this.addEvent({
        type: 'load_failure',
        timestamp: new Date(),
        details: { url, status }
      });
    }
  }

  /**
   * Inicia verificação periódica
   */
  private startPeriodicCheck(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Error in periodic health check:', error);
      }
    }, this.eventHandlers.checkInterval || 30000);
  }

  /**
   * Obtém erros recentes
   */
  private getRecentErrors(): SessionEvent[] {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    return this.healthHistory.filter(event => 
      event.type === 'load_failure' && 
      event.timestamp.getTime() > oneHourAgo
    );
  }

  /**
   * Verifica uso de memória
   */
  private async checkMemoryUsage(): Promise<number> {
    if (!this.context) return 0;

    try {
      const pages = this.context.pages();
      let totalMemory = 0;

      for (const page of pages) {
        try {
          const metrics = await page.metrics();
          totalMemory += metrics.get('JSHeapUsedSize') || 0;
        } catch (error) {
          // Ignorar erros em páginas individuais
        }
      }

      return totalMemory / (1024 * 1024); // Converter para MB

    } catch (error) {
      console.error('Error checking memory usage:', error);
      return 0;
    }
  }

  /**
   * Calcula taxa de erros de rede
   */
  private calculateNetworkErrorRate(): number {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentEvents = this.healthHistory.filter(event => 
      event.timestamp.getTime() > oneHourAgo
    );

    const totalRequests = recentEvents.length;
    const networkErrors = recentEvents.filter(event => 
      event.type === 'load_failure' && 
      event.details?.status >= 400
    ).length;

    return totalRequests > 0 ? networkErrors / totalRequests : 0;
  }

  /**
   * Adiciona evento ao histórico
   */
  private addEvent(event: SessionEvent): void {
    this.healthHistory.push(event);
    
    // Manter apenas os últimos 100 eventos
    if (this.healthHistory.length > 100) {
      this.healthHistory = this.healthHistory.slice(-100);
    }
  }

  /**
   * Obtém histórico de eventos
   */
  getEventHistory(limit?: number): SessionEvent[] {
    const events = this.healthHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Obtém eventos por tipo
   */
  getEventsByType(type: SessionEvent['type'], limit?: number): SessionEvent[] {
    const events = this.healthHistory
      .filter(event => event.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Força verificação de saúde
   */
  async forceHealthCheck(): Promise<HealthCheckResult> {
    return await this.performHealthCheck();
  }

  /**
   * Verifica se a sessão está autenticada
   */
  async isSessionAuthenticated(): Promise<{
    facebook: boolean;
    lojaDoMecanico: boolean;
    overall: boolean;
  }> {
    if (!this.context) {
      return { facebook: false, lojaDoMecanico: false, overall: false };
    }

    const pages = this.context.pages();
    let facebookAuth = false;
    let lojaAuth = false;

    for (const page of pages) {
      if (page.url().includes('facebook.com')) {
        const auth = await this.checkFacebookAuthentication(page);
        facebookAuth = auth.authenticated;
      }

      if (page.url().includes('lojadomecanico.com.br')) {
        const auth = await this.checkLojaDoMecanicoAuthentication(page);
        lojaAuth = auth.authenticated;
      }
    }

    return {
      facebook: facebookAuth,
      lojaDoMecanico: lojaAuth,
      overall: facebookAuth && lojaAuth
    };
  }

  /**
   * Obtém relatório detalhado de saúde
   */
  async getHealthReport(): Promise<{
    summary: {
      healthy: boolean;
      uptime: number;
      lastCheck: string;
      eventCount: number;
    };
    metrics: HealthMetrics;
    recentEvents: SessionEvent[];
    recommendations: string[];
  }> {
    const healthCheck = await this.performHealthCheck();
    const recentEvents = this.getEventHistory(10);

    const uptime = this.metrics.sessionAge;
    const lastCheck = new Date().toISOString();
    const eventCount = this.healthHistory.length;

    return {
      summary: {
        healthy: healthCheck.healthy,
        uptime,
        lastCheck,
        eventCount
      },
      metrics: this.metrics,
      recentEvents,
      recommendations: healthCheck.recommendations
    };
  }

  /**
   * Limpa histórico de eventos
   */
  clearEventHistory(): void {
    this.healthHistory = [];
  }

  /**
   * Exporta dados de saúde
   */
  exportHealthData(): {
    metrics: HealthMetrics;
    eventHistory: SessionEvent[];
    isMonitoring: boolean;
    eventHandlers: HealthCheckOptions;
  } {
    return {
      metrics: this.metrics,
      eventHistory: this.healthHistory,
      isMonitoring: this.isMonitoring,
      eventHandlers: this.eventHandlers
    };
  }

  /**
   * Importa dados de saúde
   */
  importHealthData(data: {
    metrics?: Partial<HealthMetrics>;
    eventHistory?: SessionEvent[];
    eventHandlers?: HealthCheckOptions;
  }): void {
    if (data.metrics) {
      this.metrics = { ...this.metrics, ...data.metrics };
    }

    if (data.eventHistory) {
      this.healthHistory = data.eventHistory;
    }

    if (data.eventHandlers) {
      this.eventHandlers = { ...this.eventHandlers, ...data.eventHandlers };
    }
  }
}
