import { Browser, BrowserContext, BrowserType, launch } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserConfig, ProfileInfo } from './browserSessionManager';

export interface ContextLaunchOptions {
  browserType: BrowserType;
  profileInfo: ProfileInfo;
  config: BrowserConfig;
}

export interface ContextLaunchResult {
  browser: Browser;
  context: BrowserContext;
  profilePath: string;
  userDataDir: string;
}

export interface PersistentContextConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  extraArgs?: string[];
  ignoreDefaultArgs?: string[];
  acceptDownloads?: boolean;
  bypassCSP?: boolean;
  javaScriptEnabled?: boolean;
  httpCredentials?: { username: string; password: string };
  proxy?: { server: string; bypass?: string[] };
  recordVideo?: { dir: string; size?: { width: number; height: number } };
  recordHar?: { path: string; content?: 'attach' | 'embed' | 'url' };
}

export class PersistentContext {
  private activeContexts: Map<string, BrowserContext> = new Map();
  private contextConfigs: Map<string, ContextLaunchOptions> = new Map();

  /**
   * Inicia contexto persistente do navegador
   */
  async launchPersistentContext(
    browserType: BrowserType,
    profileInfo: ProfileInfo,
    config: BrowserConfig
  ): Promise<ContextLaunchResult> {
    try {
      // 1. Preparar diretório de dados do usuário
      const userDataDir = await this.prepareUserDataDirectory(profileInfo, browserType);
      
      // 2. Configurar opções de lançamento
      const launchOptions = this.buildLaunchOptions(browserType, userDataDir, config);
      
      // 3. Iniciar navegador com contexto persistente
      const browser = await launch(launchOptions);
      
      // 4. Criar contexto persistente
      const context = await this.createPersistentContext(browser, userDataDir, config);
      
      // 5. Configurar contexto para persistência
      await this.configureContextForPersistence(context, config);
      
      // 6. Armazenar referências
      const contextId = `${browserType}_${profileInfo.name}_${Date.now()}`;
      this.activeContexts.set(contextId, context);
      this.contextConfigs.set(contextId, {
        browserType,
        profileInfo,
        config
      });

      return {
        browser,
        context,
        profilePath: profileInfo.directory,
        userDataDir
      };

    } catch (error) {
      console.error('Error launching persistent context:', error);
      throw error;
    }
  }

  /**
   * Prepara diretório de dados do usuário
   */
  private async prepareUserDataDirectory(
    profileInfo: ProfileInfo,
    browserType: BrowserType
  ): Promise<string> {
    // Criar diretório específico para ForgeDeals para evitar conflitos
    const forgeDealsProfileDir = path.join(
      profileInfo.directory,
      'ForgeDeals_Session'
    );

    // Se o diretório não existir, criar baseado no perfil original
    if (!fs.existsSync(forgeDealsProfileDir)) {
      // Copiar arquivos essenciais do perfil original
      await this.copyEssentialProfileFiles(profileInfo.directory, forgeDealsProfileDir);
    }

    // Verificar se o diretório tem estrutura necessária
    await this.ensureProfileStructure(forgeDealsProfileDir);

    return forgeDealsProfileDir;
  }

  /**
   * Copia arquivos essenciais do perfil original
   */
  private async copyEssentialProfileFiles(
    sourceDir: string,
    targetDir: string
  ): Promise<void> {
    try {
      // Criar diretório destino
      fs.mkdirSync(targetDir, { recursive: true });

      // Arquivos essenciais para persistência de sessão
      const essentialFiles = [
        'Cookies',
        'Local Storage',
        'Session Storage',
        'Web Data',
        'Preferences',
        'Login Data',
        'History'
      ];

      for (const file of essentialFiles) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);

        if (fs.existsSync(sourcePath)) {
          if (fs.statSync(sourcePath).isDirectory()) {
            // Copiar diretório recursivamente
            this.copyDirectory(sourcePath, targetPath);
          } else {
            // Copiar arquivo
            fs.copyFileSync(sourcePath, targetPath);
          }
        }
      }

      // Copiar arquivo de preferências se não existir
      const preferencesPath = path.join(targetDir, 'Preferences');
      if (!fs.existsSync(preferencesPath)) {
        const defaultPreferences = this.createDefaultPreferences();
        fs.writeFileSync(preferencesPath, JSON.stringify(defaultPreferences, null, 2));
      }

    } catch (error) {
      console.error('Error copying essential profile files:', error);
      throw error;
    }
  }

  /**
   * Copia diretório recursivamente
   */
  private copyDirectory(source: string, target: string): void {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      if (fs.statSync(sourcePath).isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Garante estrutura mínima do perfil
   */
  private async ensureProfileStructure(profileDir: string): Promise<void> {
    const requiredDirs = [
      'Default',
      'System Profile',
      'Guest Profile',
      'Profile 1'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(profileDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  /**
   * Constrói opções de lançamento do navegador
   */
  private buildLaunchOptions(
    browserType: BrowserType,
    userDataDir: string,
    config: BrowserConfig
  ): any {
    const baseOptions = {
      headless: config.headless || false,
      args: [
        `--user-data-dir=${userDataDir}`,
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
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-features=TranslateUI',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
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
        '--remote-debugging-port=9222'
      ],
      ignoreDefaultArgs: [
        '--enable-blink-features=AutomationControlled',
        '--enable-automation'
      ]
    };

    // Adicionar argumentos personalizados
    if (config.extraArgs) {
      baseOptions.args.push(...config.extraArgs);
    }

    // Adicionar argumentos específicos por tipo de navegador
    if (browserType === 'chromium') {
      baseOptions.args.push('--disable-web-security', '--disable-features=VizDisplayCompositor');
    }

    // Configurar viewport
    if (config.viewport) {
      baseOptions.args.push(`--window-size=${config.viewport.width},${config.viewport.height}`);
    }

    // Configurar user agent
    if (config.userAgent) {
      baseOptions.args.push(`--user-agent=${config.userAgent}`);
    }

    return baseOptions;
  }

  /**
   * Cria contexto persistente
   */
  private async createPersistentContext(
    browser: Browser,
    userDataDir: string,
    config: BrowserConfig
  ): Promise<BrowserContext> {
    const contextOptions: any = {
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      javaScriptEnabled: true,
      bypassCSP: true,
      viewport: config.viewport || { width: 1920, height: 1080 },
      userAgent: config.userAgent,
      // Configurações específicas para persistência
      serviceWorkers: 'allow',
      offline: false,
      hasTouch: false,
      isMobile: false,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      forcedColors: 'none'
    };

    // Adicionar configurações de proxy se especificado
    if (config.proxy) {
      contextOptions.proxy = config.proxy;
    }

    // Adicionar configurações de HTTP credentials se especificado
    if (config.httpCredentials) {
      contextOptions.httpCredentials = config.httpCredentials;
    }

    // Criar contexto
    const context = await browser.newContext(contextOptions);

    // Configurar eventos do contexto
    await this.setupContextEvents(context);

    return context;
  }

  /**
   * Configura contexto para persistência
   */
  private async configureContextForPersistence(
    context: BrowserContext,
    config: BrowserConfig
  ): Promise<void> {
    try {
      // Configurar cookies para persistência
      await context.addCookies([
        {
          name: 'forgedeals_session',
          value: 'persistent',
          domain: '.facebook.com',
          path: '/',
          expires: -1, // Session cookie
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
      ]);

      // Configurar armazenamento local para persistência
      await context.addInitScript(() => {
        // Garantir que localStorage persiste
        if (typeof window !== 'undefined' && window.localStorage) {
          // Configurar flags para persistência
          window.localStorage.setItem('forgedeals_persistent', 'true');
          window.localStorage.setItem('forgedeals_session_start', new Date().toISOString());
        }

        // Configurar sessionStorage
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('forgedeals_persistent', 'true');
        }
      });

      // Configurar interceptação de requisições para manter sessão
      await context.route('**/*', (route) => {
        const headers = route.request().headers();
        
        // Adicionar headers para manter sessão
        const modifiedHeaders = {
          ...headers,
          'X-ForgeDeals-Persistent': 'true',
          'X-ForgeDeals-Session': new Date().toISOString()
        };

        // Continuar com requisição modificada
        route.continue({
          headers: modifiedHeaders
        });
      });

    } catch (error) {
      console.error('Error configuring context for persistence:', error);
      // Não lançar erro, apenas log
    }
  }

  /**
   * Configura eventos do contexto
   */
  private async setupContextEvents(context: BrowserContext): Promise<void> {
    // Evento de fechamento de contexto
    context.on('close', () => {
      console.log('Browser context closed');
      this.removeContextFromTracking(context);
    });

    // Evento de erro de contexto
    context.on('error', (error) => {
      console.error('Browser context error:', error);
    });

    // Evento de nova página
    context.on('page', (page) => {
      console.log('New page created:', page.url());
      
      // Configurar eventos da página
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error('Page console error:', msg.text());
        }
      });

      page.on('pageerror', (error) => {
        console.error('Page error:', error);
      });
    });
  }

  /**
   * Remove contexto do rastreamento
   */
  private removeContextFromTracking(context: BrowserContext): void {
    for (const [id, trackedContext] of this.activeContexts.entries()) {
      if (trackedContext === context) {
        this.activeContexts.delete(id);
        this.contextConfigs.delete(id);
        break;
      }
    }
  }

  /**
   * Cria preferências padrão para o perfil
   */
  private createDefaultPreferences(): any {
    return {
      profile: {
        name: 'ForgeDeals Session',
        is_default: false,
        last_active_timestamp: Math.floor(Date.now() / 1000)
      },
      browser: {
        enabled_labs_experiments: [],
        enabled_labs_experiments_old: []
      },
      privacy: {
        safe_browsing_enabled: true,
        safe_browsing_for_android: false,
        safe_browsing_extended_reporting_enabled: false,
        safe_browsing_proceed_anyway_disabled: false,
        safe_browsing_scout_reporting_enabled: false,
        safe_browsing_trusted_download_data: true,
        safe_browsing_download_feedback: false,
        safe_browsing_password_protection: true,
        safe_browsing_allowlist_domains: []
      },
      security: {
        mixed_content_renderer_enabled: true,
        mixed_content_mode: 0,
        safe_browsing_enabled: true,
        safe_browsing_for_android: false,
        safe_browsing_extended_reporting_enabled: false,
        safe_browsing_proceed_anyway_disabled: false,
        safe_browsing_scout_reporting_enabled: false,
        safe_browsing_trusted_download_data: true,
        safe_browsing_download_feedback: false,
        safe_browsing_password_protection: true,
        safe_browsing_allowlist_domains: []
      },
      autofill: {
        enabled: true,
        offer_to_save_autofill_profiles: true,
        offer_to_save_autofill_credit_cards: true,
        credit_card_enabled: true,
        profile_enabled: true,
        address_enabled: true
      },
      password_manager: {
        enabled: true,
        offer_to_save_passwords: true,
        allow_password_generation: true,
        profile_enabled: true
      },
      translate: {
        enabled: false,
        translate_offer_enabled: false,
        translate_accept_languages: []
      },
      content_settings: {
        exceptions: {},
        default_values: {
          cookies: 1,
          javascript: 1,
          plugins: 3,
          popups: 2,
          geolocation: 2,
          notifications: 2,
          media_stream_mic: 2,
          media_stream_camera: 2,
          midi_sysex: 2,
          push_messaging: 2,
          ssl_cert_decisions: 2,
          mixed_script: 2,
          protocol_handlers: 2,
          keygen: 2,
          cookies_session_only: false,
          safe_browsing: true,
          hyperlink_auditing: false,
          referrers: 1,
          dnt: 0
        }
      }
    };
  }

  /**
   * Obtém contexto ativo por ID
   */
  getContextById(contextId: string): BrowserContext | undefined {
    return this.activeContexts.get(contextId);
  }

  /**
   * Obtém todos os contextos ativos
   */
  getAllActiveContexts(): Map<string, BrowserContext> {
    return new Map(this.activeContexts);
  }

  /**
   * Obtém configuração de um contexto
   */
  getContextConfig(contextId: string): ContextLaunchOptions | undefined {
    return this.contextConfigs.get(contextId);
  }

  /**
   * Fecha contexto específico
   */
  async closeContext(contextId: string): Promise<void> {
    const context = this.activeContexts.get(contextId);
    
    if (context && !context.browser().isConnected()) {
      await context.close();
    }
  }

  /**
   * Fecha todos os contextos ativos
   */
  async closeAllContexts(): Promise<void> {
    const closePromises = Array.from(this.activeContexts.values())
      .filter(context => !context.browser().isConnected())
      .map(context => context.close());
    
    await Promise.allSettled(closePromises);
    
    this.activeContexts.clear();
    this.contextConfigs.clear();
  }

  /**
   * Limpa diretórios de perfil temporários
   */
  async cleanupTemporaryProfiles(): Promise<void> {
    for (const [contextId, config] of this.contextConfigs.entries()) {
      try {
        const profileDir = path.join(config.profileInfo.directory, 'ForgeDeals_Session');
        
        if (fs.existsSync(profileDir)) {
          // Remover apenas se não houver contexto ativo
          const context = this.activeContexts.get(contextId);
          if (!context || context.browser().isConnected()) {
            fs.rmSync(profileDir, { recursive: true, force: true });
          }
        }
      } catch (error) {
        console.error(`Error cleaning up profile for ${contextId}:`, error);
      }
    }
  }

  /**
   * Verifica integridade do perfil
   */
  async verifyProfileIntegrity(userDataDir: string): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar se diretório existe
      if (!fs.existsSync(userDataDir)) {
        issues.push('Diretório do perfil não existe');
        recommendations.push('Criar novo diretório de perfil');
        return { valid: false, issues, recommendations };
      }

      // Verificar arquivos essenciais
      const essentialFiles = ['Preferences', 'Cookies', 'Local Storage'];
      for (const file of essentialFiles) {
        const filePath = path.join(userDataDir, file);
        if (!fs.existsSync(filePath)) {
          issues.push(`Arquivo essencial ausente: ${file}`);
          recommendations.push(`Restaurar arquivo ${file}`);
        }
      }

      // Verificar permissões
      try {
        fs.accessSync(userDataDir, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        issues.push('Sem permissões de leitura/escrita no diretório');
        recommendations.push('Verificar permissões do diretório');
      }

      // Verificar tamanho do perfil
      const stats = fs.statSync(userDataDir);
      const sizeInMB = stats.size / (1024 * 1024);
      if (sizeInMB > 1000) { // 1GB
        issues.push('Perfil muito grande');
        recommendations.push('Limpar cache e dados desnecessários');
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      issues.push('Erro ao verificar integridade do perfil');
      recommendations.push('Recriar perfil do zero');
      
      return {
        valid: false,
        issues,
        recommendations
      };
    }
  }

  /**
   * Backup do perfil
   */
  async backupProfile(userDataDir: string, backupDir?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupDir = path.join(userDataDir, '..', 'Backups');
    const targetBackupDir = backupDir || defaultBackupDir;
    const backupPath = path.join(targetBackupDir, `backup_${timestamp}`);

    try {
      // Criar diretório de backup
      fs.mkdirSync(targetBackupDir, { recursive: true });
      
      // Copiar perfil
      this.copyDirectory(userDataDir, backupPath);
      
      return backupPath;

    } catch (error) {
      console.error('Error backing up profile:', error);
      throw error;
    }
  }

  /**
   * Restaura perfil do backup
   */
  async restoreProfile(backupPath: string, targetDir: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup não encontrado');
      }

      // Fazer backup do perfil atual antes de restaurar
      if (fs.existsSync(targetDir)) {
        await this.backupProfile(targetDir);
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      // Restaurar do backup
      this.copyDirectory(backupPath, targetDir);

    } catch (error) {
      console.error('Error restoring profile:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uso do contexto
   */
  getContextStats(): {
    totalContexts: number;
    activeContexts: number;
    contextsByBrowser: Record<string, number>;
    oldestContext: string | null;
    newestContext: string | null;
  } {
    const contextsByBrowser: Record<string, number> = {};
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    let oldestContextId: string | null = null;
    let newestContextId: string | null = null;

    for (const [contextId, config] of this.contextConfigs.entries()) {
      const browserType = config.browserType;
      contextsByBrowser[browserType] = (contextsByBrowser[browserType] || 0) + 1;

      // Extrair timestamp do ID (formato: browserType_profileName_timestamp)
      const timestampMatch = contextId.match(/_(\d+)$/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        if (timestamp < oldestTimestamp) {
          oldestTimestamp = timestamp;
          oldestContextId = contextId;
        }
        if (timestamp > newestTimestamp) {
          newestTimestamp = timestamp;
          newestContextId = contextId;
        }
      }
    }

    return {
      totalContexts: this.contextConfigs.size,
      activeContexts: this.activeContexts.size,
      contextsByBrowser,
      oldestContext: oldestContextId,
      newestContext: newestContextId
    };
  }
}
