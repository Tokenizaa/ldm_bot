import { Browser, BrowserContext, chromium, firefox, webkit } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserConfig, ProfileInfo } from './browserSessionManager';

export interface LaunchOptions {
  browserType: 'chrome' | 'edge' | 'brave';
  profileInfo: ProfileInfo;
  config: BrowserConfig;
}

export interface LaunchResult {
  browser: Browser;
  context: BrowserContext;
  success: boolean;
  error?: string;
  launchTime: number;
}

export interface BrowserCapabilities {
  supportsHeadless: boolean;
  supportsProxy: boolean;
  supportsMobile: boolean;
  maxConcurrentContexts: number;
  recommendedExtensions: string[];
}

export class BrowserLauncher {
  private activeBrowsers: Map<string, Browser> = new Map();
  private launchHistory: Array<{
    browserType: string;
    timestamp: Date;
    success: boolean;
    launchTime: number;
    error?: string;
  }> = [];

  /**
   * Inicia navegador específico com perfil persistente
   */
  async launchBrowser(options: LaunchOptions): Promise<LaunchResult> {
    const startTime = Date.now();
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      console.log(`Launching ${options.browserType} with profile: ${options.profileInfo.name}`);

      // 1. Validar configurações
      this.validateLaunchOptions(options);

      // 2. Preparar opções de lançamento
      const launchArgs = this.prepareLaunchArguments(options);

      // 3. Iniciar navegador
      browser = await this.launchBrowserInstance(options.browserType, launchArgs);

      // 4. Criar contexto persistente
      context = await browser.newContext({
        ...this.buildContextOptions(options),
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        javaScriptEnabled: true,
        bypassCSP: true
      });

      // 5. Configurar contexto
      await this.configureContext(context, options);

      // 6. Armazenar referências
      const browserId = `${options.browserType}_${Date.now()}`;
      this.activeBrowsers.set(browserId, browser);

      // 7. Registrar histórico
      this.launchHistory.push({
        browserType: options.browserType,
        timestamp: new Date(),
        success: true,
        launchTime: Date.now() - startTime
      });

      console.log(`Successfully launched ${options.browserType} in ${Date.now() - startTime}ms`);

      return {
        browser,
        context,
        success: true,
        launchTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Limpar recursos em caso de erro
      if (context && !context.browser().isConnected()) {
        await context.close();
      }
      
      if (browser && !browser.isConnected()) {
        await browser.close();
      }

      // Registrar falha
      this.launchHistory.push({
        browserType: options.browserType,
        timestamp: new Date(),
        success: false,
        launchTime: Date.now() - startTime,
        error: errorMessage
      });

      console.error(`Failed to launch ${options.browserType}:`, errorMessage);

      return {
        browser: null!,
        context: null!,
        success: false,
        error: errorMessage,
        launchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Valida opções de lançamento
   */
  private validateLaunchOptions(options: LaunchOptions): void {
    if (!options.browserType) {
      throw new Error('Browser type is required');
    }

    if (!options.profileInfo || !options.profileInfo.directory) {
      throw new Error('Profile information is required');
    }

    if (!fs.existsSync(options.profileInfo.directory)) {
      throw new Error(`Profile directory does not exist: ${options.profileInfo.directory}`);
    }

    // Validar arquivo executável
    const executablePath = this.getExecutablePath(options.browserType);
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Browser executable not found: ${executablePath}`);
    }
  }

  /**
   * Prepara argumentos de lançamento
   */
  private prepareLaunchArguments(options: LaunchOptions): string[] {
    const baseArgs = [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--disable-default-apps',
      '--no-report-upload',
      '--disable-domain-reliability',
      '--disable-background-geolocation',
      '--disable-background-sync',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-features=VizDisplayCompositor',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=9222',
      `--user-data-dir=${options.profileInfo.directory}`,
    ];

    // Adicionar argumentos específicos por navegador
    const browserSpecificArgs = this.getBrowserSpecificArgs(options.browserType);
    baseArgs.push(...browserSpecificArgs);

    // Adicionar argumentos personalizados
    if (options.config.extraArgs) {
      baseArgs.push(...options.config.extraArgs);
    }

    // Configurar viewport
    if (options.config.viewport) {
      baseArgs.push(`--window-size=${options.config.viewport.width},${options.config.viewport.height}`);
    }

    // Configurar user agent
    if (options.config.userAgent) {
      baseArgs.push(`--user-agent=${options.config.userAgent}`);
    }

    return baseArgs;
  }

  /**
   * Obtém argumentos específicos por navegador
   */
  private getBrowserSpecificArgs(browserType: string): string[] {
    switch (browserType) {
      case 'chrome':
        return [
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ];
      
      case 'edge':
        return [
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-features=msEdgeLazyLoadImages'
        ];
      
      case 'brave':
        return [
          '--disable-brave-extension',
          '--disable-brave-rewards',
          '--disable-brave-shields'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Inicia instância do navegador
   */
  private async launchBrowserInstance(browserType: string, launchArgs: string[]): Promise<Browser> {
    const executablePath = this.getExecutablePath(browserType);

    const launchOptions = {
      executablePath,
      headless: false, // Sempre headless false para sessão persistente
      args: launchArgs,
      ignoreDefaultArgs: [
        '--enable-blink-features=AutomationControlled',
        '--enable-automation'
      ],
      timeout: 30000
    };

    // Usar chromium base para todos os navegadores baseados em Chrome
    return await chromium.launch(launchOptions);
  }

  /**
   * Constrói opções de contexto
   */
  private buildContextOptions(options: LaunchOptions): any {
    const contextOptions: any = {
      viewport: options.config.viewport || { width: 1920, height: 1080 },
      userAgent: options.config.userAgent || this.getDefaultUserAgent(options.browserType),
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      javaScriptEnabled: true,
      bypassCSP: true,
      serviceWorkers: 'allow',
      offline: false,
      hasTouch: false,
      isMobile: false,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      forcedColors: 'none',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
      extraHTTPHeaders: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    return contextOptions;
  }

  /**
   * Configura contexto adicional
   */
  private async configureContext(context: BrowserContext, options: LaunchOptions): Promise<void> {
    // Configurar cookies iniciais
    await this.setInitialCookies(context);

    // Configurar interceptação de requisições
    await this.setupRequestInterception(context);

    // Configurar scripts iniciais
    await this.setupInitialScripts(context);
  }

  /**
   * Define cookies iniciais
   */
  private async setInitialCookies(context: BrowserContext): Promise<void> {
    const cookies = [
      {
        name: 'forgedeals_session',
        value: 'persistent',
        domain: '.facebook.com',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      },
      {
        name: 'forgedeals_session',
        value: 'persistent',
        domain: '.lojadomecanico.com.br',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      }
    ];

    await context.addCookies(cookies);
  }

  /**
   * Configura interceptação de requisições
   */
  private async setupRequestInterception(context: BrowserContext): Promise<void> {
    await context.route('**/*', (route) => {
      const headers = route.request().headers();
      
      // Adicionar headers para identificação
      const modifiedHeaders = {
        ...headers,
        'X-ForgeDeals-Browser': 'persistent',
        'X-ForgeDeals-Version': '1.0.0',
        'X-ForgeDeals-Session': new Date().toISOString()
      };

      // Modificar headers específicos por domínio
      const url = route.request().url();
      if (url.includes('facebook.com')) {
        modifiedHeaders['X-ForgeDeals-Platform'] = 'facebook';
      } else if (url.includes('lojadomecanico.com.br')) {
        modifiedHeaders['X-ForgeDeals-Platform'] = 'lojadomecanico';
      }

      route.continue({
        headers: modifiedHeaders
      });
    });
  }

  /**
   * Configura scripts iniciais
   */
  private async setupInitialScripts(context: BrowserContext): Promise<void> {
    await context.addInitScript(() => {
      // Configurar storage para persistência
      if (typeof window !== 'undefined') {
        // Configurar localStorage
        if (window.localStorage) {
          window.localStorage.setItem('forgedeals_persistent', 'true');
          window.localStorage.setItem('forgedeals_version', '1.0.0');
          window.localStorage.setItem('forgedeals_session_start', new Date().toISOString());
        }

        // Configurar sessionStorage
        if (window.sessionStorage) {
          window.sessionStorage.setItem('forgedeals_persistent', 'true');
        }

        // Configurar navigator para detectar automação
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        // Configurar Chrome runtime
        if (window.chrome && window.chrome.runtime) {
          Object.defineProperty(window.chrome.runtime, 'onConnect', {
            get: () => undefined
          });
        }

        // Remover indicações de automação
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      }
    });
  }

  /**
   * Obtém caminho do executável
   */
  private getExecutablePath(browserType: string): string {
    const platform = process.platform;

    switch (browserType) {
      case 'chrome':
        if (platform === 'win32') {
          return path.join(
            process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
            'Google\\Chrome\\Application\\chrome.exe'
          );
        } else if (platform === 'darwin') {
          return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        } else {
          return '/usr/bin/google-chrome';
        }

      case 'edge':
        if (platform === 'win32') {
          return path.join(
            process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
            'Microsoft\\Edge\\Application\\msedge.exe'
          );
        } else if (platform === 'darwin') {
          return '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
        } else {
          return '/usr/bin/microsoft-edge';
        }

      case 'brave':
        if (platform === 'win32') {
          return path.join(
            process.env['ProgramFiles'] || 'C:\\Program Files',
            'BraveSoftware\\Brave-Browser\\Application\\brave.exe'
          );
        } else if (platform === 'darwin') {
          return '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
        } else {
          return '/usr/bin/brave-browser';
        }

      default:
        throw new Error(`Unsupported browser type: ${browserType}`);
    }
  }

  /**
   * Obtém user agent padrão
   */
  private getDefaultUserAgent(browserType: string): string {
    const baseUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    switch (browserType) {
      case 'chrome':
        return baseUserAgent.replace('Chrome', 'Chrome');
      case 'edge':
        return baseUserAgent.replace('Chrome', 'Edg/120.0.0.0');
      case 'brave':
        return baseUserAgent.replace('Chrome', 'Brave/1.61.109');
      default:
        return baseUserAgent;
    }
  }

  /**
   * Fecha navegador específico
   */
  async closeBrowser(browserId: string): Promise<boolean> {
    const browser = this.activeBrowsers.get(browserId);
    
    if (!browser) {
      return false;
    }

    try {
      if (!browser.isConnected()) {
        await browser.close();
        this.activeBrowsers.delete(browserId);
        return true;
      }

      // Fechar todos os contextos primeiro
      const contexts = browser.contexts();
      for (const context of contexts) {
        await context.close();
      }

      // Fechar navegador
      await browser.close();
      this.activeBrowsers.delete(browserId);

      return true;

    } catch (error) {
      console.error(`Error closing browser ${browserId}:`, error);
      return false;
    }
  }

  /**
   * Fecha todos os navegadores
   */
  async closeAllBrowsers(): Promise<void> {
    const closePromises = Array.from(this.activeBrowsers.entries())
      .map(([id, browser]) => this.closeBrowser(id));

    await Promise.allSettled(closePromises);
  }

  /**
   * Obtém navegadores ativos
   */
  getActiveBrowsers(): Map<string, Browser> {
    return new Map(this.activeBrowsers);
  }

  /**
   * Obtém capacidades do navegador
   */
  getBrowserCapabilities(browserType: string): BrowserCapabilities {
    const capabilities: Record<string, BrowserCapabilities> = {
      chrome: {
        supportsHeadless: true,
        supportsProxy: true,
        supportsMobile: true,
        maxConcurrentContexts: 10,
        recommendedExtensions: []
      },
      edge: {
        supportsHeadless: true,
        supportsProxy: true,
        supportsMobile: true,
        maxConcurrentContexts: 8,
        recommendedExtensions: []
      },
      brave: {
        supportsHeadless: true,
        supportsProxy: true,
        supportsMobile: true,
        maxConcurrentContexts: 6,
        recommendedExtensions: []
      }
    };

    return capabilities[browserType] || capabilities.chrome;
  }

  /**
   * Verifica se navegador está disponível
   */
  async isBrowserAvailable(browserType: string): Promise<boolean> {
    try {
      const executablePath = this.getExecutablePath(browserType);
      return fs.existsSync(executablePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém histórico de lançamentos
   */
  getLaunchHistory(limit?: number): Array<{
    browserType: string;
    timestamp: Date;
    success: boolean;
    launchTime: number;
    error?: string;
  }> {
    const history = this.launchHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Obtém estatísticas de uso
   */
  getUsageStats(): {
    totalLaunches: number;
    successfulLaunches: number;
    failedLaunches: number;
    averageLaunchTime: number;
    mostUsedBrowser: string;
    successRate: number;
  } {
    const totalLaunches = this.launchHistory.length;
    const successfulLaunches = this.launchHistory.filter(l => l.success).length;
    const failedLaunches = totalLaunches - successfulLaunches;

    const averageLaunchTime = totalLaunches > 0 
      ? this.launchHistory.reduce((sum, l) => sum + l.launchTime, 0) / totalLaunches 
      : 0;

    const browserUsage: Record<string, number> = {};
    this.launchHistory.forEach(l => {
      browserUsage[l.browserType] = (browserUsage[l.browserType] || 0) + 1;
    });

    const mostUsedBrowser = Object.entries(browserUsage)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'chrome';

    const successRate = totalLaunches > 0 ? (successfulLaunches / totalLaunches) * 100 : 0;

    return {
      totalLaunches,
      successfulLaunches,
      failedLaunches,
      averageLaunchTime: Math.round(averageLaunchTime),
      mostUsedBrowser,
      successRate: Math.round(successRate)
    };
  }

  /**
   * Limpa histórico de lançamentos
   */
  clearLaunchHistory(): void {
    this.launchHistory = [];
  }

  /**
   * Verifica saúde dos navegadores ativos
   */
  async checkBrowserHealth(): Promise<{
    healthyBrowsers: string[];
    unhealthyBrowsers: string[];
    issues: string[];
  }> {
    const healthyBrowsers: string[] = [];
    const unhealthyBrowsers: string[] = [];
    const issues: string[] = [];

    for (const [id, browser] of this.activeBrowsers.entries()) {
      try {
        if (!browser.isConnected()) {
          unhealthyBrowsers.push(id);
          issues.push(`Browser ${id} is disconnected`);
        } else {
          const contexts = browser.contexts();
          if (contexts.length === 0) {
            unhealthyBrowsers.push(id);
            issues.push(`Browser ${id} has no active contexts`);
          } else {
            healthyBrowsers.push(id);
          }
        }
      } catch (error) {
        unhealthyBrowsers.push(id);
        issues.push(`Error checking browser ${id}: ${error}`);
      }
    }

    return {
      healthyBrowsers,
      unhealthyBrowsers,
      issues
    };
  }

  /**
   * Exporta dados do launcher
   */
  exportLauncherData(): {
    activeBrowsers: string[];
    launchHistory: Array<{
      browserType: string;
      timestamp: Date;
      success: boolean;
      launchTime: number;
      error?: string;
    }>;
    usageStats: ReturnType<typeof this.getUsageStats>;
  } {
    return {
      activeBrowsers: Array.from(this.activeBrowsers.keys()),
      launchHistory: this.getLaunchHistory(),
      usageStats: this.getUsageStats()
    };
  }
}
