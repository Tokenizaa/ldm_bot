import { chromium, Browser, BrowserContext } from 'playwright';
import { getCDPUrl } from './portDetector';

export interface ChromeConnection {
  browser: Browser;
  context: BrowserContext;
  isConnected: boolean;
}

export class ChromeConnector {
  private static instance: ChromeConnector;
  private connection: ChromeConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {}

  static getInstance(): ChromeConnector {
    if (!ChromeConnector.instance) {
      ChromeConnector.instance = new ChromeConnector();
    }
    return ChromeConnector.instance;
  }

  async connect(): Promise<ChromeConnection> {
    const cdpUrl = getCDPUrl();

    const browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();
    if (!contexts.length) {
      throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    }

      const context = contexts[0]!;

    this.connection = {
      browser,
      context,
      isConnected: true
    };

    this.reconnectAttempts = 0;
      return this.connection;
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;
    await this.connection.browser.close();
    this.connection = null;
  }

  async getConnection(): Promise<ChromeConnection> {
    if (!this.connection || !this.connection.isConnected) {
      return await this.connect();
    }
    return this.connection;
  }

  async reconnect(): Promise<ChromeConnection> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error(`Máximo de tentativas de reconexão atingido: ${this.maxReconnectAttempts}`);
    }

    this.reconnectAttempts++;
    await this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await this.connect();
  }
}

export default ChromeConnector;
