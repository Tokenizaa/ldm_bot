import { BrowserConfig } from './browserConfig.js';
import ChromeConnector from './chromeConnector.js';

export interface SessionStatus {
  facebook: { isLoggedIn: boolean; username?: string; lastCheck: Date; cookiesCount: number };
  lojaMecanico: { isLoggedIn: boolean; username?: string; lastCheck: Date; cookiesCount: number };
  overall: { isValid: boolean; lastCheck: Date; issues: string[] };
}

export class SessionMonitor {
  private static instance: SessionMonitor;
  private readonly connector = ChromeConnector.getInstance();
  private status: SessionStatus = {
    facebook: { isLoggedIn: false, lastCheck: new Date(), cookiesCount: 0 },
    lojaMecanico: { isLoggedIn: false, lastCheck: new Date(), cookiesCount: 0 },
    overall: { isValid: false, lastCheck: new Date(), issues: [] }
  };

  private constructor() {}

  static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) SessionMonitor.instance = new SessionMonitor();
    return SessionMonitor.instance;
  }

  async validateAllSessions(): Promise<SessionStatus> {
    await this.validateFacebookSession();
    await this.validateLojaMecanicoSession();
    this.evaluateOverallStatus();
    return this.status;
  }

  async validateFacebookSession(): Promise<boolean> {
    return this.validateSite('facebook');
  }

  async validateLojaMecanicoSession(): Promise<boolean> {
    return this.validateSite('lojaMecanico');
  }

  private async validateSite(site: 'facebook' | 'lojaMecanico'): Promise<boolean> {
    const page = await (await this.connector.getConnection()).context.newPage();
    const url = site === 'facebook' ? 'https://www.facebook.com' : 'https://www.lojadomecanico.com.br';
    const domain = site === 'facebook' ? 'facebook.com' : 'lojadomecanico.com.br';

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: BrowserConfig.PAGE_LOAD_TIMEOUT });
      const currentUrl = page.url();
      const isLoggedIn = site === 'facebook'
        ? !currentUrl.includes('login') && !currentUrl.includes('checkpoint')
        : !currentUrl.includes('/login');
      const cookies = (await page.context().cookies()).filter((cookie) => cookie.domain.includes(domain));
      this.status[site] = { isLoggedIn, lastCheck: new Date(), cookiesCount: cookies.length };
      return isLoggedIn;
    } catch {
      this.status[site].isLoggedIn = false;
      this.status[site].lastCheck = new Date();
      return false;
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  private evaluateOverallStatus(): void {
    const issues: string[] = [];
    if (!this.status.facebook.isLoggedIn) issues.push('Facebook não está logado');
    if (!this.status.lojaMecanico.isLoggedIn) issues.push('Loja Mecânico não está logada');
    this.status.overall = { isValid: issues.length === 0, lastCheck: new Date(), issues };
  }

  getStatus(): SessionStatus {
    return {
      facebook: { ...this.status.facebook },
      lojaMecanico: { ...this.status.lojaMecanico },
      overall: { ...this.status.overall }
    };
  }
}

export default SessionMonitor;
