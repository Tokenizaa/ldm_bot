import ChromeConnector from './chromeConnector';

export class SimpleSessionMonitor {
  private static instance: SimpleSessionMonitor;
  private connector: ChromeConnector;

  private constructor() {
    this.connector = ChromeConnector.getInstance();
  }

  static getInstance(): SimpleSessionMonitor {
    if (!SimpleSessionMonitor.instance) {
      SimpleSessionMonitor.instance = new SimpleSessionMonitor();
    }
    return SimpleSessionMonitor.instance;
  }

  async validateFacebookSession(): Promise<boolean> {
    try {
      const connection = await this.connector.getConnection();
      const page = await connection.context.newPage();

      await page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes('login') && !currentUrl.includes('checkpoint');

      await page.close();
      return isLoggedIn;
    } catch {
      return false;
    }
  }

  async validateLojaSession(): Promise<boolean> {
    try {
      const connection = await this.connector.getConnection();
      const page = await connection.context.newPage();

      await page.goto('https://www.lojadomecanico.com.br', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const currentUrl = page.url();
      const isLoggedIn = !currentUrl.includes('/login');

      await page.close();
      return isLoggedIn;
    } catch {
      return false;
    }
  }
}

export default SimpleSessionMonitor;
