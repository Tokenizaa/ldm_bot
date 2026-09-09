import { chromium, type Browser, type BrowserContext } from 'playwright';
import { BrowserConfig } from './browserConfig.js';

export interface ChromeConnection {
  browser: Browser;
  context: BrowserContext;
  isConnected: boolean;
}

export class ChromeConnector {
  private static instance: ChromeConnector;
  private connection: ChromeConnection | null = null;

  private constructor() {}

  static getInstance(): ChromeConnector {
    if (!ChromeConnector.instance) ChromeConnector.instance = new ChromeConnector();
    return ChromeConnector.instance;
  }

  async connect(port = BrowserConfig.CDP_DEFAULT_PORT): Promise<ChromeConnection> {
    const browser = await chromium.connectOverCDP(
      `http://${BrowserConfig.CDP_HOST}:${port}`
    );
    const context = browser.contexts()[0];
    if (!context) {
      await browser.close().catch(() => undefined);
      throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    }

    this.connection = { browser, context, isConnected: true };
    return this.connection;
  }

  async getConnection(port = BrowserConfig.CDP_DEFAULT_PORT): Promise<ChromeConnection> {
    if (this.connection?.isConnected) return this.connection;
    return this.connect(port);
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;
    await this.connection.browser.close().catch(() => undefined);
    this.connection = null;
  }
}

export default ChromeConnector;
