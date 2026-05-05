import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CDPInstance {
  port: number;
  host: string;
  webSocketDebuggerUrl: string;
  devtoolsFrontendUrl: string;
  title?: string;
  url?: string;
  type: string;
}

export class PortDetector {
  private static instance: PortDetector;
  private cachedInstances: CDPInstance[] = [];
  private lastScan: Date = new Date();
  private scanInterval = 5000; // 5 segundos

  private constructor() {}

  static getInstance(): PortDetector {
    if (!PortDetector.instance) {
      PortDetector.instance = new PortDetector();
    }
    return PortDetector.instance;
  }

  async detectCDPInstances(): Promise<CDPInstance[]> {
    const now = new Date();

    // Usar cache se recente
    if (now.getTime() - this.lastScan.getTime() < this.scanInterval && this.cachedInstances.length > 0) {
      return this.cachedInstances;
    }

    try {
      // Método 1: Verificar portas comuns (9222-9230)
      const commonPorts = [9222, 9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230];
      const instances: CDPInstance[] = [];

      for (const port of commonPorts) {
        try {
          const instance = await this.testPort(port);
          if (instance) {
            instances.push(instance);
          }
        } catch {
          // Porta não disponível, continuar
        }
      }

      // Método 2: Escanear portas Chrome via netstat (Windows)
      if (instances.length === 0) {
        const netstatInstances = await this.scanChromePorts();
        instances.push(...netstatInstances);
      }

      // Método 3: Verificar portas em uso pelo Chrome
      if (instances.length === 0) {
        const chromePorts = await this.getChromeDebugPorts();
        for (const port of chromePorts) {
          try {
            const instance = await this.testPort(port);
            if (instance) {
              instances.push(instance);
            }
          } catch {
            // Porta não é CDP
          }
        }
      }

      this.cachedInstances = instances;
      this.lastScan = now;

      return instances;
    } catch {
      return this.cachedInstances; // cache se disponível
    }
  }

  private async testPort(port: number): Promise<CDPInstance | null> {
    try {
      const response = await fetch(`http://localhost:${port}/json/version`, {
        signal: AbortSignal.timeout(2000)
      });

      if (!response.ok) {
        return null;
      }

      const version = await response.json();

      // Verificar se é realmente Chrome CDP
      if (!version.Browser || !version['Protocol-Version']) {
        return null;
      }

      return {
        port,
        host: 'localhost',
        webSocketDebuggerUrl: version.webSocketDebuggerUrl,
        devtoolsFrontendUrl: version.devtoolsFrontendUrl,
        type: 'chrome',
        title: version.Browser
      };
    } catch {
      return null;
    }
  }

  private async scanChromePorts(): Promise<CDPInstance[]> {
    try {
      const { stdout } = await execAsync('netstat -ano | findstr LISTENING | findstr :9');
      const lines = stdout.split('\n').filter(line => line.trim());

      const instances: CDPInstance[] = [];

      for (const line of lines) {
        const match = line.match(/:(\d+)\s+/);
        if (match && match[1]) {
          const port = parseInt(match[1], 10);
          if (port >= 9222 && port <= 9230) {
            const instance = await this.testPort(port);
            if (instance) instances.push(instance);
          }
        }
      }

      return instances;
    } catch {
      return [];
    }
  }

  private async getChromeDebugPorts(): Promise<number[]> {
    try {
      const { stdout } = await execAsync('wmic process where "name=\'chrome.exe\'" get commandline /format:list');
      const lines = stdout.split('\n');

      const ports = new Set<number>();

      for (const line of lines) {
        if (line.includes('--remote-debugging-port=')) {
          const match = line.match(/--remote-debugging-port=(\d+)/);
          if (match && match[1]) ports.add(parseInt(match[1], 10));
        }
      }

      return Array.from(ports);
    } catch {
      return [];
    }
  }

  async getBestInstance(): Promise<CDPInstance | null> {
    const instances = await this.detectCDPInstances();
    if (instances.length === 0) return null;

    const preferred = instances.find(instance => instance.port === 9222);
    return preferred || instances[0] || null;
  }

  getCDPUrl(instance: CDPInstance): string {
    return `http://${instance.host}:${instance.port}`;
  }
}

export default PortDetector;
