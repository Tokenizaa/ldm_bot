import { BrowserConfig } from './browserConfig';
import ChromeConnector from './chromeConnector';

export interface CDPCommand {
  method: string;
  params?: Record<string, any>;
}

export interface CDPResponse {
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface TargetInfo {
  id: string;
  title: string;
  url: string;
  type: string;
  webSocketDebuggerUrl: string;
}

export class CDPManager {
  private static instance: CDPManager;
  private connector: ChromeConnector;
  private commandId: number = 0;
  private pendingCommands: Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private constructor() {
    this.connector = ChromeConnector.getInstance();
  }

  static getInstance(): CDPManager {
    if (!CDPManager.instance) {
      CDPManager.instance = new CDPManager();
    }
    return CDPManager.instance;
  }

  async executeCommand(targetId: string, command: CDPCommand, timeout: number = 10000): Promise<any> {
    const commandId = ++this.commandId;
    
    try {
      // Obter WebSocket URL do target
      const targetInfo = await this.getTargetInfo(targetId);
      if (!targetInfo) {
        throw new Error(`Target ${targetId} não encontrado`);
      }

      // Executar comando via WebSocket
      const result = await this.sendWebSocketCommand(targetInfo.webSocketDebuggerUrl, {
        id: commandId,
        method: command.method,
        params: command.params || {}
      }, timeout);

      return result;

    } catch (error) {
      console.error(`❌ Erro ao executar comando ${command.method}:`, error);
      throw error;
    }
  }

  async getTargets(): Promise<TargetInfo[]> {
    try {
      const response = await fetch(`${BrowserConfig.CDP_URL}/json`);
      const targets = await response.json();
      
      return targets.map((target: any) => ({
        id: target.id,
        title: target.title,
        url: target.url,
        type: target.type,
        webSocketDebuggerUrl: target.webSocketDebuggerUrl
      }));

    } catch (error) {
      console.error('❌ Erro ao obter targets:', error);
      return [];
    }
  }

  async getTargetInfo(targetId: string): Promise<TargetInfo | null> {
    const targets = await this.getTargets();
    return targets.find(target => target.id === targetId) || null;
  }

  async getPages(): Promise<TargetInfo[]> {
    const targets = await this.getTargets();
    return targets.filter(target => target.type === 'page');
  }

  async enableRuntime(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Runtime.enable'
    });
  }

  async enablePage(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Page.enable'
    });
  }

  async enableNetwork(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Network.enable'
    });
  }

  async enableDOM(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'DOM.enable'
    });
  }

  async navigate(targetId: string, url: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Page.navigate',
      params: { url }
    });
  }

  async reload(targetId: string, ignoreCache: boolean = false): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Page.reload',
      params: { ignoreCache }
    });
  }

  async evaluate(targetId: string, expression: string): Promise<any> {
    const result = await this.executeCommand(targetId, {
      method: 'Runtime.evaluate',
      params: {
        expression,
        returnByValue: true,
        awaitPromise: true
      }
    });

    if (result.error) {
      throw new Error(`Erro na execução: ${result.error.message}`);
    }

    return result.result.value;
  }

  async click(targetId: string, selector: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (selector => {
            const element = document.querySelector(selector);
            if (element) {
              element.click();
              return true;
            }
            return false;
          })('${selector}')
        `,
        returnByValue: true
      }
    });
  }

  async type(targetId: string, selector: string, text: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (selector, text => {
            const element = document.querySelector(selector);
            if (element) {
              element.focus();
              element.value = '';
              element.value = text;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          })('${selector}', '${text.replace(/'/g, "\\'")}')
        `,
        returnByValue: true
      }
    });
  }

  async waitForSelector(targetId: string, selector: string, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.executeCommand(targetId, {
          method: 'Runtime.evaluate',
          params: {
            expression: `document.querySelector('${selector}') !== null`,
            returnByValue: true
          }
        });

        if (result.result.value) {
          return true;
        }
      } catch (error) {
        // Continuar tentando
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return false;
  }

  async getScreenshot(targetId: string, format: 'png' | 'jpeg' = 'png', quality?: number): Promise<string> {
    const params: any = {
      format
    };

    if (format === 'jpeg' && quality) {
      params.quality = quality;
    }

    const result = await this.executeCommand(targetId, {
      method: 'Page.captureScreenshot',
      params
    });

    return result.data; // Base64
  }

  async getDOMContent(targetId: string): Promise<string> {
    const result = await this.executeCommand(targetId, {
      method: 'DOM.getDocument'
    });

    const document = await this.executeCommand(targetId, {
      method: 'DOM.getOuterHTML',
      params: {
        nodeId: result.root.nodeId
      }
    });

    return document.outerHTML;
  }

  async getCookies(targetId: string): Promise<any[]> {
    const result = await this.executeCommand(targetId, {
      method: 'Network.getAllCookies'
    });

    return result.cookies || [];
  }

  async setCookie(targetId: string, cookie: any): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Network.setCookie',
      params: cookie
    });
  }

  async clearBrowserCache(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Network.clearBrowserCache'
    });
  }

  async clearBrowserCookies(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Network.clearBrowserCookies'
    });
  }

  async getConsoleMessages(targetId: string): Promise<any[]> {
    const result = await this.executeCommand(targetId, {
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (() => {
            const messages = [];
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            console.log = (...args) => messages.push({ type: 'log', args });
            console.error = (...args) => messages.push({ type: 'error', args });
            console.warn = (...args) => messages.push({ type: 'warn', args });
            
            return messages;
          })()
        `,
        returnByValue: true
      }
    });

    return result.result.value || [];
  }

  async simulateMobile(targetId: string, device: 'iphone' | 'android'): Promise<void> {
    const devices = {
      iphone: {
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        mobile: true
      },
      android: {
        width: 360,
        height: 640,
        deviceScaleFactor: 2,
        mobile: true
      }
    };

    const deviceConfig = devices[device];
    
    await this.executeCommand(targetId, {
      method: 'Emulation.setDeviceMetricsOverride',
      params: deviceConfig
    });
  }

  async resetEmulation(targetId: string): Promise<void> {
    await this.executeCommand(targetId, {
      method: 'Emulation.clearDeviceMetricsOverride'
    });
  }

  private async sendWebSocketCommand(webSocketUrl: string, command: any, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      // Implementar WebSocket client
      // Nota: Em ambiente real, usaríamos biblioteca como 'ws'
      // Por enquanto, simulamos via fetch para comandos básicos
      
      const ws = new WebSocket(webSocketUrl);
      
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error(`Timeout na execução do comando ${command.method}`));
      }, timeout);

      ws.onopen = () => {
        ws.send(JSON.stringify(command));
      };

      ws.onmessage = (event) => {
        clearTimeout(timeoutId);
        const response = JSON.parse(event.data);
        
        if (response.id === command.id) {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
          ws.close();
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
      };
    });
  }

  async closeTarget(targetId: string): Promise<void> {
    await fetch(`${BrowserConfig.CDP_URL}/json/close/${targetId}`);
  }

  async activateTarget(targetId: string): Promise<void> {
    await fetch(`${BrowserConfig.CDP_URL}/json/activate/${targetId}`);
  }

  async getBrowserVersion(): Promise<any> {
    const response = await fetch(`${BrowserConfig.CDP_URL}/json/version`);
    return response.json();
  }

  async getMemoryInfo(): Promise<any> {
    try {
      const response = await fetch(`${BrowserConfig.CDP_URL}/json/memory`);
      return response.json();
    } catch (error) {
      console.error('❌ Erro ao obter informações de memória:', error);
      return null;
    }
  }

  async getCPUInfo(): Promise<any> {
    try {
      const response = await fetch(`${BrowserConfig.CDP_URL}/json/cpu`);
      return response.json();
    } catch (error) {
      console.error('❌ Erro ao obter informações de CPU:', error);
      return null;
    }
  }
}

export default CDPManager;
