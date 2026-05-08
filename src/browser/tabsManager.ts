import ChromeConnector from './chromeConnector';

export class SimpleTabsManager {
  private static instance: SimpleTabsManager;
  private connector: ChromeConnector;

  private constructor() {
    this.connector = ChromeConnector.getInstance();
  }

  static getInstance(): SimpleTabsManager {
    if (!SimpleTabsManager.instance) {
      SimpleTabsManager.instance = new SimpleTabsManager();
    }
    return SimpleTabsManager.instance;
  }

  async getFacebookTab(): Promise<any> {
    const connection = await this.connector.getConnection();
    const page = await connection.context.newPage();
    await page.goto('https://www.facebook.com');
    return page;
  }

  async getLojaTab(): Promise<any> {
    const connection = await this.connector.getConnection();
    const page = await connection.context.newPage();
    await page.goto('https://www.lojadomecanico.com.br');
    return page;
  }
}

export default SimpleTabsManager;

