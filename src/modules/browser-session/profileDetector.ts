import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface BrowserInfo {
  type: 'chrome' | 'edge' | 'brave';
  name: string;
  executablePath: string;
  version?: string;
  isInstalled: boolean;
  isDefault?: boolean;
}

export interface ProfileInfo {
  name: string;
  directory: string;
  isDefault: boolean;
  lastUsed: Date;
  size: number;
  userDataPath: string;
}

export interface ProfileDetectionResult {
  browsers: Record<string, BrowserInfo>;
  profiles: Record<string, ProfileInfo[]>;
  defaultBrowser: string;
  systemInfo: {
    platform: string;
    arch: string;
    userHome: string;
  };
}

export class ProfileDetector {
  private cache: Map<string, ProfileDetectionResult> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  /**
   * Detecta todos os navegadores disponíveis no sistema
   */
  async detectAvailableBrowsers(): Promise<Record<string, BrowserInfo>> {
    const cacheKey = 'browsers';
    const cached = this.getCachedResult(cacheKey);
    
    if (cached) {
      return cached.browsers;
    }

    const browsers: Record<string, BrowserInfo> = {};

    // Detectar Chrome
    const chromeInfo = await this.detectChrome();
    if (chromeInfo.isInstalled) {
      browsers.chrome = chromeInfo;
    }

    // Detectar Edge
    const edgeInfo = await this.detectEdge();
    if (edgeInfo.isInstalled) {
      browsers.edge = edgeInfo;
    }

    // Detectar Brave
    const braveInfo = await this.detectBrave();
    if (braveInfo.isInstalled) {
      browsers.brave = braveInfo;
    }

    // Detectar navegador padrão do sistema
    const defaultBrowser = await this.detectSystemDefaultBrowser();
    
    // Atualizar informação de navegador padrão
    Object.keys(browsers).forEach(key => {
      browsers[key].isDefault = key === defaultBrowser;
    });

    const result = {
      browsers,
      profiles: {},
      defaultBrowser,
      systemInfo: this.getSystemInfo()
    };

    this.setCachedResult(cacheKey, result);
    
    return browsers;
  }

  /**
   * Detecta perfis disponíveis para um navegador específico
   */
  async detectProfiles(browserExecutablePath: string): Promise<ProfileInfo[]> {
    const cacheKey = `profiles_${browserExecutablePath}`;
    const cached = this.getCachedResult(cacheKey);
    
    if (cached) {
      return cached.profiles[browserExecutablePath] || [];
    }

    const profiles: ProfileInfo[] = [];
    
    try {
      // Determinar diretório de perfis baseado no executável
      const profileBaseDir = this.getProfileBaseDirectory(browserExecutablePath);
      
      if (!profileBaseDir || !fs.existsSync(profileBaseDir)) {
        return profiles;
      }

      // Listar todos os diretórios de perfis
      const entries = fs.readdirSync(profileBaseDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const profilePath = path.join(profileBaseDir, entry.name);
          const profileInfo = await this.analyzeProfile(profilePath, entry.name);
          
          if (profileInfo) {
            profiles.push(profileInfo);
          }
        }
      }

      // Ordenar por último usado (mais recente primeiro)
      profiles.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

    } catch (error) {
      console.error('Error detecting profiles:', error);
    }

    const result = {
      browsers: {},
      profiles: { [browserExecutablePath]: profiles },
      defaultBrowser: '',
      systemInfo: this.getSystemInfo()
    };

    this.setCachedResult(cacheKey, result);
    
    return profiles;
  }

  /**
   * Detecta instalação do Google Chrome
   */
  private async detectChrome(): Promise<BrowserInfo> {
    const platform = os.platform();
    let executablePath = '';
    let name = 'Google Chrome';

    try {
      if (platform === 'win32') {
        // Windows
        const possiblePaths = [
          path.join('C:', 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join('C:', 'Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe')
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

        // Tentar detectar via registry
        if (!executablePath) {
          try {
            const { stdout } = await execAsync(
              'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /v Path'
            );
            const match = stdout.match(/REG_SZ\s+(.+)/);
            if (match) {
              executablePath = path.join(match[1].trim(), 'chrome.exe');
            }
          } catch (error) {
            // Registry não encontrado ou acesso negado
          }
        }

      } else if (platform === 'darwin') {
        // macOS
        possiblePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          path.join(os.homedir(), 'Applications', 'Google Chrome.app/Contents/MacOS/Google Chrome')
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

      } else if (platform === 'linux') {
        // Linux
        const possiblePaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium-browser',
          '/snap/bin/chromium'
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

        // Tentar via which
        if (!executablePath) {
          try {
            const { stdout } = await execAsync('which google-chrome || which chromium-browser || which chromium');
            executablePath = stdout.trim();
          } catch (error) {
            // Comando não encontrado
          }
        }
      }

      // Obter versão se instalado
      let version = '';
      if (executablePath) {
        try {
          const { stdout } = await execAsync(`"${executablePath}" --version`);
          const versionMatch = stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (versionMatch) {
            version = versionMatch[1];
          }
        } catch (error) {
          // Não foi possível obter versão
        }
      }

      return {
        type: 'chrome',
        name,
        executablePath,
        version,
        isInstalled: !!executablePath
      };

    } catch (error) {
      return {
        type: 'chrome',
        name,
        executablePath: '',
        isInstalled: false
      };
    }
  }

  /**
   * Detecta instalação do Microsoft Edge
   */
  private async detectEdge(): Promise<BrowserInfo> {
    const platform = os.platform();
    let executablePath = '';
    let name = 'Microsoft Edge';

    try {
      if (platform === 'win32') {
        // Windows
        const possiblePaths = [
          path.join('C:', 'Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join('C:', 'Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

        // Tentar detectar via registry
        if (!executablePath) {
          try {
            const { stdout } = await execAsync(
              'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe" /v Path'
            );
            const match = stdout.match(/REG_SZ\s+(.+)/);
            if (match) {
              executablePath = path.join(match[1].trim(), 'msedge.exe');
            }
          } catch (error) {
            // Registry não encontrado
          }
        }

      } else if (platform === 'darwin') {
        // macOS
        possiblePaths = [
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          path.join(os.homedir(), 'Applications', 'Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

      } else if (platform === 'linux') {
        // Linux
        const possiblePaths = [
          '/usr/bin/microsoft-edge',
          '/usr/bin/microsoft-edge-stable'
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

        // Tentar via which
        if (!executablePath) {
          try {
            const { stdout } = await execAsync('which microsoft-edge || which microsoft-edge-stable');
            executablePath = stdout.trim();
          } catch (error) {
            // Comando não encontrado
          }
        }
      }

      // Obter versão se instalado
      let version = '';
      if (executablePath) {
        try {
          const { stdout } = await execAsync(`"${executablePath}" --version`);
          const versionMatch = stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (versionMatch) {
            version = versionMatch[1];
          }
        } catch (error) {
          // Não foi possível obter versão
        }
      }

      return {
        type: 'edge',
        name,
        executablePath,
        version,
        isInstalled: !!executablePath
      };

    } catch (error) {
      return {
        type: 'edge',
        name,
        executablePath: '',
        isInstalled: false
      };
    }
  }

  /**
   * Detecta instalação do Brave Browser
   */
  private async detectBrave(): Promise<BrowserInfo> {
    const platform = os.platform();
    let executablePath = '';
    let name = 'Brave Browser';

    try {
      if (platform === 'win32') {
        // Windows
        const possiblePaths = [
          path.join('C:', 'Program Files', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          path.join('C:', 'Program Files (x86)', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          path.join(os.homedir(), 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

      } else if (platform === 'darwin') {
        // macOS
        possiblePaths = [
          '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
          path.join(os.homedir(), 'Applications', 'Brave Browser.app/Contents/MacOS/Brave Browser')
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

      } else if (platform === 'linux') {
        // Linux
        const possiblePaths = [
          '/usr/bin/brave-browser',
          '/usr/bin/brave',
          '/snap/bin/brave'
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            executablePath = possiblePath;
            break;
          }
        }

        // Tentar via which
        if (!executablePath) {
          try {
            const { stdout } = await execAsync('which brave-browser || which brave');
            executablePath = stdout.trim();
          } catch (error) {
            // Comando não encontrado
          }
        }
      }

      // Obter versão se instalado
      let version = '';
      if (executablePath) {
        try {
          const { stdout } = await execAsync(`"${executablePath}" --version`);
          const versionMatch = stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (versionMatch) {
            version = versionMatch[1];
          }
        } catch (error) {
          // Não foi possível obter versão
        }
      }

      return {
        type: 'brave',
        name,
        executablePath,
        version,
        isInstalled: !!executablePath
      };

    } catch (error) {
      return {
        type: 'brave',
        name,
        executablePath: '',
        isInstalled: false
      };
    }
  }

  /**
   * Detecta navegador padrão do sistema
   */
  private async detectSystemDefaultBrowser(): Promise<string> {
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        // Windows - verificar registry
        const { stdout } = await execAsync(
          'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId'
        );
        
        if (stdout.includes('ChromeHTML')) return 'chrome';
        if (stdout.includes('MSEdgeHTM')) return 'edge';
        if (stdout.includes('BraveHTML')) return 'brave';
        
      } else if (platform === 'darwin') {
        // macOS - verificar preferências do sistema
        const { stdout } = await execAsync('defaults read com.apple.LaunchServices/com.apple.launchservices.secure | grep -A 10 "LSHandlerURLScheme = http"');
        
        if (stdout.includes('chrome')) return 'chrome';
        if (stdout.includes('edge')) return 'edge';
        if (stdout.includes('brave')) return 'brave';
        
      } else if (platform === 'linux') {
        // Linux - verificar xdg-settings
        try {
          const { stdout } = await execAsync('xdg-settings get default-web-browser');
          
          if (stdout.includes('chrome')) return 'chrome';
          if (stdout.includes('edge')) return 'edge';
          if (stdout.includes('brave')) return 'brave';
        } catch (error) {
          // xdg-settings não disponível
        }
      }
    } catch (error) {
      // Não foi possível detectar navegador padrão
    }

    // Fallback para Chrome se disponível
    return 'chrome';
  }

  /**
   * Obtém diretório base de perfis para um navegador
   */
  private getProfileBaseDirectory(executablePath: string): string | null {
    const platform = os.platform();
    const userHome = os.homedir();

    try {
      if (executablePath.includes('chrome')) {
        if (platform === 'win32') {
          return path.join(userHome, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
        } else if (platform === 'darwin') {
          return path.join(userHome, 'Library', 'Application Support', 'Google', 'Chrome');
        } else {
          return path.join(userHome, '.config', 'google-chrome');
        }
      }

      if (executablePath.includes('edge') || executablePath.includes('msedge')) {
        if (platform === 'win32') {
          return path.join(userHome, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data');
        } else if (platform === 'darwin') {
          return path.join(userHome, 'Library', 'Application Support', 'Microsoft Edge');
        } else {
          return path.join(userHome, '.config', 'microsoft-edge');
        }
      }

      if (executablePath.includes('brave')) {
        if (platform === 'win32') {
          return path.join(userHome, 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data');
        } else if (platform === 'darwin') {
          return path.join(userHome, 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser');
        } else {
          return path.join(userHome, '.config', 'brave');
        }
      }

    } catch (error) {
      console.error('Error getting profile base directory:', error);
    }

    return null;
  }

  /**
   * Analisa um diretório de perfil específico
   */
  private async analyzeProfile(profilePath: string, profileName: string): Promise<ProfileInfo | null> {
    try {
      // Verificar se é um perfil válido (contém arquivos essenciais)
      const essentialFiles = ['Preferences', 'Cookies', 'Local Storage'];
      let isValidProfile = false;

      for (const file of essentialFiles) {
        const filePath = path.join(profilePath, file);
        if (fs.existsSync(filePath)) {
          isValidProfile = true;
          break;
        }
      }

      if (!isValidProfile) {
        return null;
      }

      // Obter informações do diretório
      const stats = fs.statSync(profilePath);
      let lastUsed = stats.mtime;
      let size = 0;

      // Tentar ler arquivo de preferências para obter última atividade
      const preferencesPath = path.join(profilePath, 'Preferences');
      if (fs.existsSync(preferencesPath)) {
        try {
          const preferencesContent = fs.readFileSync(preferencesPath, 'utf8');
          const preferences = JSON.parse(preferencesContent);
          
          // Verificar última atividade no perfil
          if (preferences.profile && preferences.profile.last_active_timestamp) {
            lastUsed = new Date(preferences.profile.last_active_timestamp * 1000);
          }

          // Verificar se é perfil padrão
          const isDefault = preferences.profile && preferences.profile.is_default;
          
          // Calcular tamanho total do perfil
          size = this.calculateDirectorySize(profilePath);

          return {
            name: profileName,
            directory: profilePath,
            isDefault: isDefault || false,
            lastUsed,
            size,
            userDataPath: profilePath
          };

        } catch (error) {
          // Falha ao ler preferências, usar informações básicas
          size = this.calculateDirectorySize(profilePath);
        }
      }

      // Fallback se não conseguir ler preferências
      return {
        name: profileName,
        directory: profilePath,
        isDefault: profileName === 'Default' || profileName === 'Profile 1',
        lastUsed,
        size,
        userDataPath: profilePath
      };

    } catch (error) {
      console.error(`Error analyzing profile ${profileName}:`, error);
      return null;
    }
  }

  /**
   * Calcula tamanho total de um diretório
   */
  private calculateDirectorySize(dirPath: string): number {
    let totalSize = 0;

    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignorar erros de permissão
    }

    return totalSize;
  }

  /**
   * Obtém informações do sistema
   */
  private getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      userHome: os.homedir()
    };
  }

  /**
   * Obtém resultado em cache
   */
  private getCachedResult(key: string): ProfileDetectionResult | null {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.lastUpdate) < this.cacheTimeout) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Armazena resultado em cache
   */
  private setCachedResult(key: string, data: ProfileDetectionResult): void {
    this.cache.set(key, {
      data,
      lastUpdate: Date.now()
    });
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Verifica se navegador está instalado
   */
  async isBrowserInstalled(browserType: 'chrome' | 'edge' | 'brave'): Promise<boolean> {
    const browsers = await this.detectAvailableBrowsers();
    return browsers[browserType]?.isInstalled || false;
  }

  /**
   * Obtém caminho do executável
   */
  async getExecutablePath(browserType: 'chrome' | 'edge' | 'brave'): Promise<string> {
    const browsers = await this.detectAvailableBrowsers();
    return browsers[browserType]?.executablePath || '';
  }

  /**
   * Obtém perfil padrão de um navegador
   */
  async getDefaultProfile(browserType: 'chrome' | 'edge' | 'brave'): Promise<ProfileInfo | null> {
    const browsers = await this.detectAvailableBrowsers();
    const browserInfo = browsers[browserType];
    
    if (!browserInfo?.executablePath) {
      return null;
    }

    const profiles = await this.detectProfiles(browserInfo.executablePath);
    return profiles.find(p => p.isDefault) || profiles[0] || null;
  }

  /**
   * Lista todos os perfis disponíveis
   */
  async listAllProfiles(): Promise<Record<string, ProfileInfo[]>> {
    const browsers = await this.detectAvailableBrowsers();
    const allProfiles: Record<string, ProfileInfo[]> = {};

    for (const [browserType, browserInfo] of Object.entries(browsers)) {
      if (browserInfo.isInstalled && browserInfo.executablePath) {
        const profiles = await this.detectProfiles(browserInfo.executablePath);
        allProfiles[browserType] = profiles;
      }
    }

    return allProfiles;
  }

  /**
   * Valida se um perfil é válido para uso
   */
  async validateProfile(browserType: 'chrome' | 'edge' | 'brave', profileName: string): Promise<{
    valid: boolean;
    error?: string;
    profileInfo?: ProfileInfo;
  }> {
    try {
      const browsers = await this.detectAvailableBrowsers();
      const browserInfo = browsers[browserType];
      
      if (!browserInfo?.isInstalled) {
        return {
          valid: false,
          error: `Navegador ${browserType} não está instalado`
        };
      }

      const profiles = await this.detectProfiles(browserInfo.executablePath);
      const profile = profiles.find(p => p.name === profileName);
      
      if (!profile) {
        return {
          valid: false,
          error: `Perfil "${profileName}" não encontrado`
        };
      }

      // Verificar se o diretório do perfil existe e é acessível
      if (!fs.existsSync(profile.directory)) {
        return {
          valid: false,
          error: `Diretório do perfil não existe: ${profile.directory}`
        };
      }

      // Verificar se tem arquivos essenciais
      const essentialFiles = ['Preferences', 'Cookies'];
      for (const file of essentialFiles) {
        const filePath = path.join(profile.directory, file);
        if (!fs.existsSync(filePath)) {
          return {
            valid: false,
            error: `Arquivo essencial não encontrado: ${file}`
          };
        }
      }

      return {
        valid: true,
        profileInfo: profile
      };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
