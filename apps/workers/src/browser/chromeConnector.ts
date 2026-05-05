import { chromium, Browser, BrowserContext } from 'playwright';
import PortDetector, { CDPInstance } from './portDetector';

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
  private portDetector: PortDetector;
  private currentInstance: CDPInstance | null = null;

  private constructor() {
    this.portDetector = PortDetector.getInstance();
  }

  static getInstance(): ChromeConnector {
    if (!ChromeConnector.instance) {
      ChromeConnector.instance = new ChromeConnector();
    }
    return ChromeConnector.instance;
  }

  async connect(): Promise<ChromeConnection> {
    // Detectar instância CDP disponível
    const instance = await this.portDetector.getBestInstance();
    if (!instance) {
      throw new Error('Nenhuma instância CDP encontrada. Inicie o Chrome com --remote-debugging-port.');
    }

    this.currentInstance = instance;
    const cdpUrl = this.portDetector.getCDPUrl(instance);

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

  async getTabs(): Promise<any[]> {
    if (!this.currentInstance) await this.getConnection();
    if (!this.currentInstance) return [];

    const cdpUrl = this.portDetector.getCDPUrl(this.currentInstance);
    const response = await fetch(`${cdpUrl}/json/tabs`);
    return response.json();
  }

  async activateTab(tabId: string): Promise<void> {
    if (!this.currentInstance) throw new Error('Nenhuma instância CDP disponível');
    const cdpUrl = this.portDetector.getCDPUrl(this.currentInstance);
    const response = await fetch(`${cdpUrl}/json/activate/${tabId}`);
    if (!response.ok) throw new Error(`Falha ao ativar aba ${tabId}`);
  }

  async closeTab(tabId: string): Promise<void> {
    if (!this.currentInstance) throw new Error('Nenhuma instância CDP disponível');
    const cdpUrl = this.portDetector.getCDPUrl(this.currentInstance);
    const response = await fetch(`${cdpUrl}/json/close/${tabId}`);
    if (!response.ok) throw new Error(`Falha ao fechar aba ${tabId}`);
  }
}

export default ChromeConnector;
