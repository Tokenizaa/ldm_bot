import { BrowserConfig } from './browserSessionManager';

export interface WindowsProfileInfo {
  name: string;
  directory: string;
  browserType: 'chromium';
}

export class WindowsChromeConfig {
  /**
   * Configuração para usar perfil existente do Chrome no Windows
   */
  static getWindowsChromeConfig(profileName: string = 'Profile 1'): {
    profileInfo: WindowsProfileInfo;
    browserConfig: BrowserConfig;
  } {
    // Caminho base do Chrome no Windows
    const baseUserDataDir = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data';
    
    return {
      profileInfo: {
        name: `Windows Chrome - ${profileName}`,
        directory: `${baseUserDataDir}\\${profileName}`,
        browserType: 'chromium'
      },
      browserConfig: {
        browserType: 'chrome',
        profileName: profileName,
        profileDirectory: `${baseUserDataDir}\\${profileName}`,
        headless: false, // MUITO IMPORTANTE: headless false como solicitado
        viewport: { width: 1920, height: 1080 },
        extraArgs: [
          `--user-data-dir=${baseUserDataDir}`,
          `--profile-directory=${profileName}`,
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
          '--remote-debugging-port=9222'
        ]
      }
    };
  }

  /**
   * Configuração para Facebook com sessão real
   */
  static getFacebookConfig(): {
    profileInfo: WindowsProfileInfo;
    browserConfig: BrowserConfig;
  } {
    const config = this.getWindowsChromeConfig('Profile 1');
    
    // Configurações específicas para Facebook
    config.browserConfig.extraArgs?.push(
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    return config;
  }

  /**
   * Configuração para Loja do Mecânico
   */
  static getLojaDoMecanicoConfig(): {
    profileInfo: WindowsProfileInfo;
    browserConfig: BrowserConfig;
  } {
    const config = this.getWindowsChromeConfig('Profile 2');
    
    // Configurações específicas para Loja do Mecânico
    config.browserConfig.extraArgs?.push(
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    return config;
  }

  /**
   * Lista todos os perfis disponíveis no Windows
   */
  static async getAvailableProfiles(): Promise<string[]> {
    const fs = require('fs');
    const path = require('path');
    
    const baseUserDataDir = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data';
    
    try {
      const items = fs.readdirSync(baseUserDataDir, { withFileTypes: true });
      return items
        .filter(item => item.isDirectory())
        .map(item => item.name)
        .filter(name => name.startsWith('Profile ') || name === 'Default');
    } catch (error) {
      console.error('Erro ao ler perfis do Chrome:', error);
      return ['Default', 'Profile 1', 'Profile 2']; // Perfis comuns como fallback
    }
  }

  /**
   * Verifica se um perfil específico existe
   */
  static profileExists(profileName: string): boolean {
    const fs = require('fs');
    const path = require('path');
    
    const profilePath = `C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data\\${profileName}`;
    return fs.existsSync(profilePath);
  }

  /**
   * Obtém informações detalhadas de um perfil
   */
  static getProfileInfo(profileName: string): {
    exists: boolean;
    path: string;
    size?: number;
    lastModified?: Date;
  } {
    const fs = require('fs');
    const path = require('path');
    
    const profilePath = `C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data\\${profileName}`;
    
    try {
      const stats = fs.statSync(profilePath);
      return {
        exists: true,
        path: profilePath,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        path: profilePath
      };
    }
  }
}
