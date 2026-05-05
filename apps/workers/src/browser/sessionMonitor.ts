import { BrowserConfig } from './browserConfig';
import ChromeConnector from './chromeConnector';

export interface SessionStatus {
  facebook: { isLoggedIn: boolean; username?: string; lastCheck: Date; cookiesCount: number };
  lojaMecanico: { isLoggedIn: boolean; username?: string; lastCheck: Date; cookiesCount: number };
  overall: { isValid: boolean; lastCheck: Date; issues: string[] };
}

export class SessionMonitor {
  private static instance: SessionMonitor;
  private connector: ChromeConnector;
  private status: SessionStatus;

  private constructor() {
    this.connector = ChromeConnector.getInstance();
    this.status = this.initializeStatus();
  }

  static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) SessionMonitor.instance = new SessionMonitor();
    return SessionMonitor.instance;
  }

  private initializeStatus(): SessionStatus {
    return {
      facebook: { isLoggedIn: false, lastCheck: new Date(), cookiesCount: 0 },
      lojaMecanico: { isLoggedIn: false, lastCheck: new Date(), cookiesCount: 0 },
      overall: { isValid: false, lastCheck: new Date(), issues: [] }
    };
  }

  async validateAllSessions(): Promise<SessionStatus> {
    await this.validateFacebookSession();
    await this.validateLojaMecanicoSession();
    this.evaluateOverallStatus();
    this.status.overall.lastCheck = new Date();
    return this.status;
  }

  async validateFacebookSession(): Promise<boolean> {
    try {
      const connection = await this.connector.getConnection();
      const page = await connection.context.newPage();

      await page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle',
        timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
      });

      const isLoggedIn = await this.checkFacebookLogin(page);

      const cookies = await page.context().cookies();
      const facebookCookies = cookies.filter((cookie: any) => cookie.domain.includes('facebook.com'));

      const username = isLoggedIn ? await this.extractFacebookUsername(page) : undefined;
      this.status.facebook = {
        isLoggedIn,
        lastCheck: new Date(),
        cookiesCount: facebookCookies.length,
        ...(username ? { username } : {})
      };

      await page.close();
      return isLoggedIn;
    } catch {
      this.status.facebook.isLoggedIn = false;
      this.status.facebook.lastCheck = new Date();
      return false;
    }
  }

  async validateLojaMecanicoSession(): Promise<boolean> {
    try {
      const connection = await this.connector.getConnection();
      const page = await connection.context.newPage();

      await page.goto('https://www.lojadomecanico.com.br', {
        waitUntil: 'networkidle',
        timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
      });

      const isLoggedIn = await this.checkLojaMecanicoLogin(page);

      const cookies = await page.context().cookies();
      const ldmCookies = cookies.filter((cookie: any) => cookie.domain.includes('lojadomecanico.com.br'));

      const username = isLoggedIn ? await this.extractLojaMecanicoUsername(page) : undefined;
      this.status.lojaMecanico = {
        isLoggedIn,
        lastCheck: new Date(),
        cookiesCount: ldmCookies.length,
        ...(username ? { username } : {})
      };

      await page.close();
      return isLoggedIn;
    } catch {
      this.status.lojaMecanico.isLoggedIn = false;
      this.status.lojaMecanico.lastCheck = new Date();
      return false;
    }
  }

  private async checkFacebookLogin(page: any): Promise<boolean> {
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) return false;

    const loginIndicators = [
      '[data-testid="bluebarDOMInspector"]',
      '[aria-label="Facebook"]',
      '[role="navigation"]',
      '[data-testid="user_menu"]'
    ];

    for (const selector of loginIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        return true;
      } catch {
        continue;
      }
    }

    try {
      await page.waitForSelector('form[data-testid="royal_login_form"]', { timeout: 3000 });
      return false;
    } catch {
      return true;
    }
  }

  private async checkLojaMecanicoLogin(page: any): Promise<boolean> {
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) return false;

    const loginIndicators = ['.user-menu', '.user-info', '[data-user]', '.logout-btn', '.minha-conta'];
    for (const selector of loginIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        return true;
      } catch {
        continue;
      }
    }

    try {
      await page.waitForSelector('form[action*="login"]', { timeout: 3000 });
      return false;
    } catch {
      return true;
    }
  }

  private async extractFacebookUsername(page: any): Promise<string | undefined> {
    const selectors = [
      '[data-testid="user_menu"] span',
      '[aria-label="Conta"] span',
      '.user-name',
      '[data-visualcompletion="header"] span'
    ];

    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 2000 });
        const text = await element.textContent();
        if (text && text.trim() && text !== 'Facebook') return text.trim();
      } catch {
        continue;
      }
    }

    return undefined;
  }

  private async extractLojaMecanicoUsername(page: any): Promise<string | undefined> {
    const selectors = ['.user-name', '.user-info span', '.minha-conta span', '[data-user] span'];

    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 2000 });
        const text = await element.textContent();
        if (text && text.trim()) return text.trim();
      } catch {
        continue;
      }
    }

    return undefined;
  }

  private evaluateOverallStatus(): void {
    const issues: string[] = [];

    if (!this.status.facebook.isLoggedIn) issues.push('Facebook não está logado');
    if (!this.status.lojaMecanico.isLoggedIn) issues.push('Loja Mecânico não está logada');
    if (this.status.facebook.cookiesCount === 0) issues.push('Sem cookies do Facebook');
    if (this.status.lojaMecanico.cookiesCount === 0) issues.push('Sem cookies da Loja Mecânico');

    this.status.overall = { isValid: issues.length === 0, lastCheck: new Date(), issues };
  }

  getStatus(): SessionStatus {
    return { ...this.status };
  }
}

export default SessionMonitor;
