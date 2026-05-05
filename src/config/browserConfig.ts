import { BrowserConfig } from '../modules/browser-session/browserSessionManager';
import { WindowsChromeConfig } from '../modules/browser-session/windowsChromeConfig';

/**
 * Configuração global de browser padrão para todo o projeto
 * Define Windows Chrome Profile 1 como padrão para todos os crawlers
 */
export class GlobalBrowserConfig {
  private static instance: GlobalBrowserConfig;
  private defaultConfig: BrowserConfig;

  private constructor() {
    // Configuração padrão usando Windows Chrome Profile 1
    const { browserConfig } = WindowsChromeConfig.getFacebookConfig();
    
    this.defaultConfig = {
      ...browserConfig,
      // Garantir headless: false como padrão para todo o projeto
      headless: false,
      // Adicionar configurações adicionais para compatibilidade
      extraArgs: [
        ...(browserConfig.extraArgs || []),
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI,VizDisplayCompositor',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-report-upload',
        '--disable-domain-reliability',
        '--disable-background-geolocation',
        '--disable-background-sync',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-gpu',
        '--remote-debugging-port=9222'
      ]
    };
  }

  static getInstance(): GlobalBrowserConfig {
    if (!GlobalBrowserConfig.instance) {
      GlobalBrowserConfig.instance = new GlobalBrowserConfig();
    }
    return GlobalBrowserConfig.instance;
  }

  /**
   * Obtém configuração padrão para todos os crawlers
   */
  getDefaultConfig(): BrowserConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Obtém configuração específica para Facebook (usa Profile 1)
   */
  getFacebookConfig(): BrowserConfig {
    const config = this.getDefaultConfig();
    
    // Garantir que use Profile 1
    config.profileDirectory = 'Profile 1';
    config.profileName = 'Profile 1';
    
    // Adicionar user agent específico para Facebook
    config.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    return config;
  }

  /**
   * Obtém configuração específica para Loja do Mecânico (usa Profile 2)
   */
  getLojaDoMecanicoConfig(): BrowserConfig {
    const config = this.getDefaultConfig();
    
    // Garantir que use Profile 2
    config.profileDirectory = 'Profile 2';
    config.profileName = 'Profile 2';
    
    return {
      ...config,
      headless: false, // Garantir headless: false
      extraArgs: [
        ...(config.extraArgs || []),
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    };
  }

  /**
   * Obtém configuração para crawlers genéricos
   */
  getCrawlerConfig(): BrowserConfig {
    return this.getDefaultConfig();
  }

  /**
   * Obtém configuração para testes
   */
  getTestConfig(): BrowserConfig {
    const config = this.getDefaultConfig();
    
    // Para testes, manter headless: false para verificação visual
    config.headless = false;
    
    return config;
  }

  /**
   * Atualiza configuração padrão
   */
  updateDefaultConfig(newConfig: Partial<BrowserConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
    console.log('⚙️ Configuração global de browser atualizada');
  }

  /**
   * Obtém informações do perfil padrão
   */
  getProfileInfo(): {
    name: string;
    directory: string;
    browserType: string;
  } {
    const { profileInfo } = WindowsChromeConfig.getFacebookConfig();
    
    return {
      name: profileInfo.name,
      directory: profileInfo.directory,
      browserType: profileInfo.browserType
    };
  }

  /**
   * Verifica se perfil padrão está disponível
   */
  async isDefaultProfileAvailable(): Promise<boolean> {
    const fs = require('fs');
    const profilePath = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1';
    
    try {
      return fs.existsSync(profilePath);
    } catch (error) {
      console.error('Erro ao verificar perfil padrão:', error);
      return false;
    }
  }

  /**
   * Resumo da configuração atual
   */
  getConfigSummary(): {
    profile: string;
    headless: boolean;
    browserType: string;
    userDataDir: string;
    argsCount: number;
  } {
    const profileInfo = this.getProfileInfo();
    
    return {
      profile: profileInfo.name,
      headless: this.defaultConfig.headless || false,
      browserType: this.defaultConfig.browserType,
      userDataDir: 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data',
      argsCount: this.defaultConfig.extraArgs?.length || 0
    };
  }
}

// Exportar instância singleton
export const globalBrowserConfig = GlobalBrowserConfig.getInstance();

// Exportar configurações específicas para uso direto
export const defaultBrowserConfig = globalBrowserConfig.getDefaultConfig();
export const facebookBrowserConfig = globalBrowserConfig.getFacebookConfig();
export const lojaDoMecanicoBrowserConfig = globalBrowserConfig.getLojaDoMecanicoConfig();
export const crawlerBrowserConfig = globalBrowserConfig.getCrawlerConfig();
export const testBrowserConfig = globalBrowserConfig.getTestConfig();
