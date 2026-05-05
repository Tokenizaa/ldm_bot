import { chromium, Browser, BrowserContext, Page, CDPSession } from 'playwright';
import { EventEmitter } from 'events';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

export interface ForgeBrowserConfig {
  cdpUrl: string;
  profilePath: string;
  headless?: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
  screenshotsDir?: string;
  logsDir?: string;
}

export interface BrowserHealthStatus {
  isConnected: boolean;
  isHealthy: boolean;
  lastCheck: Date;
  uptime: number;
  memoryUsage?: number;
  pagesCount: number;
  contextsCount: number;
  issues: string[];
}

export interface SessionValidationResult {
  platform: string;
  isValid: boolean;
  isLoggedIn: boolean;
  userInfo?: {
    name?: string;
    email?: string;
    id?: string;
  };
  issues: string[];
}

/**
 * Gerenciador profissional de browser para ForgeDeals
 * Usa CDP (Chrome DevTools Protocol) para conectar em Chrome isolado
 * 
 * Arquitetura:
 * - NÃO usa launchPersistentContext()
 * - SEMPRE usa connectOverCDP()
 * - Profile isolado em C:\forge-browser\chrome-profile
 * - Reconexão automática
 * - Health check contínuo
 */
export class ForgeBrowserManager extends EventEmitter {
  private static instance: ForgeBrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: ForgeBrowserConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastHealthStatus: BrowserHealthStatus | null = null;
  private startTime: Date | null = null;
  private screenshotsDir: string;
  private logsDir: string;

  private constructor(config?: Partial<ForgeBrowserConfig>) {
    super();
    
    const forgeDir = 'C:\\forge-browser';
    this.screenshotsDir = config?.screenshotsDir || join(forgeDir, 'screenshots');
    this.logsDir = config?.logsDir || join(forgeDir, 'logs');
    
    // Criar diretórios se não existirem
    if (!existsSync(this.screenshotsDir)) {
      mkdirSync(this.screenshotsDir, { recursive: true });
    }
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }

    this.config = {
      cdpUrl: config?.cdpUrl || 'http://127.0.0.1:9222',
      profilePath: config?.profilePath || join(forgeDir, 'chrome-profile'),
      headless: config?.headless ?? false,
      slowMo: config?.slowMo ?? 0,
      viewport: config?.viewport || { width: 1920, height: 1080 },
      screenshotsDir: this.screenshotsDir,
      logsDir: this.logsDir
    };
  }

  static getInstance(config?: Partial<ForgeBrowserConfig>): ForgeBrowserManager {
    if (!ForgeBrowserManager.instance) {
      ForgeBrowserManager.instance = new ForgeBrowserManager(config);
    }
    return ForgeBrowserManager.instance;
  }

  /**
   * Verifica se CDP está disponível
   */
  async isCDPAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.cdpUrl}/json/version`, {
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Conecta ao Chrome via CDP
   * NÃO inicia novo Chrome - conecta em instância existente
   */
  async connect(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    if (this.isConnecting) {
      throw new Error('Conexão já em andamento');
    }

    if (this.browser && this.isConnected()) {
      console.log('✅ Já conectado ao Chrome CDP');
      return { 
        browser: this.browser, 
        context: this.context!, 
        page: this.page! 
      };
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    try {
      console.log(`🔌 Conectando ao Chrome CDP (${this.config.cdpUrl})...`);

      // Verificar CDP disponível
      const isAvailable = await this.isCDPAvailable();
      if (!isAvailable) {
        throw new Error(
          `CDP não disponível em ${this.config.cdpUrl}\n` +
          `Execute primeiro: scripts\\start-forge-browser.bat`
        );
      }

      // Conectar via CDP - NÃO usar launch!
      this.browser = await chromium.connectOverCDP(this.config.cdpUrl);
      
      // Obter ou criar contexto
      const contexts = this.browser.contexts();
      if (contexts.length > 0) {
        this.context = contexts[0];
        console.log(`   📑 Contexto existente: ${contexts.length} contexto(s)`);
      } else {
        this.context = await this.browser.newContext({
          viewport: this.config.viewport
        });
        console.log('   📑 Novo contexto criado');
      }

      // Obter ou criar página
      const pages = this.context.pages();
      if (pages.length > 0) {
        this.page = pages[0];
        console.log(`   📄 Página existente: ${pages.length} página(s)`);
      } else {
        this.page = await this.context.newPage();
        console.log('   📄 Nova página criada');
      }

      this.startTime = new Date();
      this.connectionAttempts = 0;
      
      console.log('✅ Conectado ao Chrome CDP com sucesso');
      
      // Iniciar health check
      this.startHealthCheck();
      
      // Emitir evento
      this.emit('connected', { browser: this.browser, context: this.context, page: this.page });

      return { browser: this.browser, context: this.context, page: this.page };

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      this.emit('connectionError', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Desconecta do Chrome
   */
  async disconnect(): Promise<void> {
    this.stopHealthCheck();
    
    if (this.browser) {
      try {
        // Para CDP, apenas removemos a referência - não fechamos o browser
        // O Chrome continuará rodando independentemente
        const wasConnected = this.browser.isConnected();
        this.browser = null;
        this.context = null;
        this.page = null;
        this.startTime = null;
        
        if (wasConnected) {
          console.log('🔌 Desconectado do Chrome CDP (browser continua rodando)');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao desconectar:', error);
      }
    }
    
    this.emit('disconnected');
  }

  /**
   * Reconecta automaticamente
   */
  async reconnect(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    console.log('🔄 Iniciando reconexão...');
    
    await this.disconnect();
    
    // Aguardar um pouco antes de reconectar
    await new Promise(r => setTimeout(r, 2000));
    
    return this.connect();
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.browser !== null && !this.browser.isConnected() === false;
  }

  /**
   * Obtém instâncias atuais
   */
  getInstances(): { browser: Browser | null; context: BrowserContext | null; page: Page | null } {
    return {
      browser: this.browser,
      context: this.context,
      page: this.page
    };
  }

  /**
   * Inicia health check periódico
   */
  private startHealthCheck(intervalMs = 10000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);

    console.log(`💓 Health check iniciado (${intervalMs}ms)`);
  }

  /**
   * Para health check
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('💓 Health check parado');
    }
  }

  /**
   * Verifica saúde do browser
   */
  async checkHealth(): Promise<BrowserHealthStatus> {
    const issues: string[] = [];
    let isHealthy = true;
    let pagesCount = 0;
    let contextsCount = 0;
    let memoryUsage: number | undefined;

    try {
      // Verificar conexão CDP
      const cdpAvailable = await this.isCDPAvailable();
      if (!cdpAvailable) {
        issues.push('CDP não responde');
        isHealthy = false;
      }

      // Verificar browser
      if (!this.browser) {
        issues.push('Browser não inicializado');
        isHealthy = false;
      } else if (!this.isConnected()) {
        issues.push('Browser desconectado');
        isHealthy = false;
      } else {
        try {
          contextsCount = this.browser.contexts().length;
          
          // Tentar obter informações de memória via CDP
          const cdpSession = await this.browser.newBrowserCDPSession();
          const metrics = await cdpSession.send('Performance.getMetrics');
          const jsHeapSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize');
          if (jsHeapSize) {
            memoryUsage = Math.round(jsHeapSize.value / 1024 / 1024); // MB
          }
        } catch (e) {
          // Ignora erro de métricas
        }
      }

      // Verificar contexto e páginas
      if (this.context) {
        try {
          pagesCount = this.context.pages().length;
        } catch {
          issues.push('Erro ao acessar páginas');
        }
      }

    } catch (error) {
      issues.push(`Erro no health check: ${error}`);
      isHealthy = false;
    }

    const uptime = this.startTime 
      ? Math.floor((Date.now() - this.startTime.getTime()) / 1000)
      : 0;

    const status: BrowserHealthStatus = {
      isConnected: this.isConnected(),
      isHealthy,
      lastCheck: new Date(),
      uptime,
      memoryUsage,
      pagesCount,
      contextsCount,
      issues
    };

    this.lastHealthStatus = status;

    // Emitir alerta se não estiver saudável
    if (!isHealthy && this.isConnected()) {
      console.warn('⚠️ Browser não está saudável:', issues);
      this.emit('unhealthy', status);
      
      // Tentar reconexão automática se necessário
      if (this.connectionAttempts < this.maxReconnectAttempts) {
        console.log('🔄 Tentando reconexão automática...');
        try {
          await this.reconnect();
        } catch (error) {
          console.error('❌ Falha na reconexão automática:', error);
        }
      }
    }

    return status;
  }

  /**
   * Obtém último status de saúde
   */
  getHealthStatus(): BrowserHealthStatus | null {
    return this.lastHealthStatus;
  }

  /**
   * Aguarda browser ficar saudável
   */
  async waitForHealthy(timeoutMs = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkHealth();
      if (status.isHealthy) {
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    throw new Error(`Timeout aguardando browser ficar saudável (${timeoutMs}ms)`);
  }

  /**
   * Tira screenshot da página atual
   */
  async takeScreenshot(name?: string): Promise<string> {
    if (!this.page) {
      throw new Error('Página não disponível');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name || 'screenshot'}-${timestamp}.png`;
    const filepath = join(this.screenshotsDir, filename);

    await this.page.screenshot({ 
      path: filepath,
      fullPage: true 
    });

    console.log(`📸 Screenshot salvo: ${filepath}`);
    return filepath;
  }

  /**
   * Salva log em arquivo
   */
  saveLog(name: string, data: unknown): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.json`;
    const filepath = join(this.logsDir, filename);

    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`📝 Log salvo: ${filepath}`);
    return filepath;
  }

  /**
   * Obtém lista de páginas abertas
   */
  async getPages(): Promise<Page[]> {
    if (!this.context) {
      return [];
    }
    return this.context.pages();
  }

  /**
   * Abre nova aba
   */
  async openNewTab(url?: string): Promise<Page> {
    if (!this.context) {
      throw new Error('Contexto não disponível');
    }

    const page = await this.context.newPage();
    if (url) {
      await page.goto(url);
    }
    
    this.page = page;
    return page;
  }

  /**
   * Fecha abas exceto a principal
   */
  async closeExtraTabs(): Promise<number> {
    if (!this.context) {
      return 0;
    }

    const pages = this.context.pages();
    if (pages.length <= 1) {
      return 0;
    }

    const mainPage = this.page || pages[0];
    let closed = 0;

    for (const page of pages) {
      if (page !== mainPage) {
        await page.close();
        closed++;
      }
    }

    console.log(`🧹 ${closed} aba(s) fechada(s)`);
    return closed;
  }

  /**
   * Destrói instância singleton
   */
  static destroy(): void {
    if (ForgeBrowserManager.instance) {
      ForgeBrowserManager.instance.disconnect();
      ForgeBrowserManager.instance = null as any;
    }
  }
}

// Export singleton
export const forgeBrowser = ForgeBrowserManager.getInstance();
