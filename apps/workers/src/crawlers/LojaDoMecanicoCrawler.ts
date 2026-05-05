import { Page } from 'playwright';
import { AffiliateLink } from '@forge-deals/shared/types';
import ChromeConnector from '../browser/chromeConnector';
import SessionMonitor from '../browser/sessionMonitor';
import TabsManager from '../browser/tabsManager';
import { BrowserConfig } from '../browser/browserConfig';
import { affiliateLinkService } from '../services/affiliateLinkService';

export interface LojaDoMecanicoConfig {
  email: string;
  password: string;
  rateLimit?: number;
  autoLogin?: boolean;
}

export class LojaDoMecanicoCrawler {
  private page: Page | null = null;
  private config: LojaDoMecanicoConfig;
  private connector: ChromeConnector;
  private sessionMonitor: SessionMonitor;
  private tabsManager: TabsManager;

  constructor(config: LojaDoMecanicoConfig) {
    this.config = {
      rateLimit: 2000,
      autoLogin: true,
      ...config
    };

    this.connector = ChromeConnector.getInstance();
    this.sessionMonitor = SessionMonitor.getInstance();
    this.tabsManager = TabsManager.getInstance();
  }

  async initialize(): Promise<void> {
    const connection = await this.connector.getConnection();

    if (this.config.autoLogin) {
      await this.sessionMonitor.validateAllSessions();
    }

    await this.tabsManager.getOrCreateTab('https://www.lojadomecanico.com.br', true);

    this.page = await connection.context.newPage();
    await this.setupPage();
  }

  private async setupPage(): Promise<void> {
    if (!this.page) return;

    // User-Agent should be set at context level; keep headers/viewport here.
    await this.page.setViewportSize(BrowserConfig.DEFAULT_VIEWPORT);
    await this.page.setExtraHTTPHeaders(BrowserConfig.DEFAULT_HEADERS);
    this.page.setDefaultTimeout(BrowserConfig.ELEMENT_WAIT_TIMEOUT);
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      const currentUrl = this.page.url();
      if (currentUrl.includes('lojadomecanico.com.br') && !currentUrl.includes('/login')) {
        const hasUserElement = await this.page.locator('[data-user]').count() > 0;
        if (hasUserElement) return true;
      }

      await this.page.goto('https://www.lojadomecanico.com.br/login', {
        waitUntil: 'networkidle',
        timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
      });

      await this.page.waitForSelector('[placeholder*="E-mail"]', { timeout: BrowserConfig.ELEMENT_WAIT_TIMEOUT });
      await this.page.fill('[placeholder*="E-mail"]', this.config.email);
      await this.page.click('button:has-text("Continuar")');

      await this.page.waitForSelector('[placeholder*="Senha"]', { timeout: BrowserConfig.ELEMENT_WAIT_TIMEOUT });
      await this.page.fill('[placeholder*="Senha"]', this.config.password);
      await this.page.click('button:has-text("Continuar")');

      await this.page.waitForSelector('[data-user]', { timeout: 15000 });

      await this.sessionMonitor.validateLojaMecanicoSession();
      return true;
    } catch {
      return false;
    }
  }

  async extractProductsFromCategory(
    categoryUrl: string = 'https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas'
  ): Promise<AffiliateLink[]> {
    if (!this.page) throw new Error('Page not initialized');

    const products: AffiliateLink[] = [];

    await this.page.goto(categoryUrl, {
      waitUntil: 'networkidle',
      timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
    });

    // Collect product links (best-effort; selectors are site-dependent)
    const productUrls: string[] = await this.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/produto/"]')) as HTMLAnchorElement[];
      return anchors.map(a => a.href).filter(Boolean);
    });

    for (const productUrl of productUrls.slice(0, 10)) {
      const product = await this.extractProductFromUrl(productUrl);
      if (product) products.push(product);
      if (this.config.rateLimit) await this.page.waitForTimeout(this.config.rateLimit);
    }

    return products;
  }

  private async extractProductFromUrl(productUrl: string): Promise<AffiliateLink | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.page.goto(productUrl, { waitUntil: 'networkidle', timeout: BrowserConfig.PAGE_LOAD_TIMEOUT });
      await this.page.waitForTimeout(1000);

      const productData = await this.page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() || '';
        const price = (document.querySelector('[class*="price"]') as HTMLElement | null)?.textContent?.trim() || '';
        const oldPrice = (document.querySelector('[class*="old"]') as HTMLElement | null)?.textContent?.trim() || '';
        const image = (document.querySelector('img') as HTMLImageElement | null)?.src;
        const brand = (document.querySelector('.brand') as HTMLElement | null)?.textContent?.trim();
        const category = (document.querySelector('.breadcrumb a:last-child') as HTMLElement | null)?.textContent?.trim();

        return { title, price, oldPrice, image, brand, category, url: location.href };
      });

      if (!productData.title || !productData.price) return null;

      const currentPrice = this.parsePrice(productData.price);
      const oldPrice = productData.oldPrice ? this.parsePrice(productData.oldPrice) : currentPrice;

      // Transitional: affiliate URL generation still depends on site modal. For now, store original.
      const affiliateUrl = productData.url;

      const affiliateLink: AffiliateLink = {
        id: '',
        product_name: productData.title,
        affiliate_url: affiliateUrl,
        original_url: productData.url,
        current_price: currentPrice,
        previous_price: oldPrice,
        lowest_price: currentPrice,
        category: productData.category || 'Não categorizado',
        brand: productData.brand || 'Sem marca',
        monitored: true,
        last_checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price_drop_percentage: oldPrice > currentPrice ? ((oldPrice - currentPrice) / oldPrice) * 100 : 0,
        opportunity_score: oldPrice > currentPrice ? Math.min(100, ((oldPrice - currentPrice) / oldPrice) * 200) : 0
      };

      return affiliateLink;
    } catch {
      return null;
    }
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    return parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));
  }

  async saveProducts(products: AffiliateLink[]): Promise<void> {
    for (const product of products) {
      const existing = await affiliateLinkService.findByAffiliateUrl(product.affiliate_url);
      if (existing) {
        if (existing.current_price !== product.current_price) {
          await affiliateLinkService.addPriceRecord(existing.id, product.current_price);
        }
      } else {
        await affiliateLinkService.createLink(product);
      }
    }
  }

  async run(): Promise<{ success: boolean; products: AffiliateLink[]; error?: string }> {
    try {
      await this.initialize();

      const loginSuccess = await this.login();
      if (!loginSuccess) throw new Error('Falha no login');

      const products = await this.extractProductsFromCategory();
      if (products.length > 0) await this.saveProducts(products);

      return { success: true, products };
    } catch (error) {
      return { success: false, products: [], error: error instanceof Error ? error.message : 'Erro desconhecido' };
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    await this.tabsManager.autoCleanupIfNeeded();
  }
}

export async function runLojaDoMecanicoCrawler(): Promise<void> {
  if (!process.env.LOJA_DO_MECANICO_EMAIL || !process.env.LOJA_DO_MECANICO_PASSWORD) {
    throw new Error('Missing required env vars: LOJA_DO_MECANICO_EMAIL / LOJA_DO_MECANICO_PASSWORD');
  }

  const crawler = new LojaDoMecanicoCrawler({
    email: process.env.LOJA_DO_MECANICO_EMAIL,
    password: process.env.LOJA_DO_MECANICO_PASSWORD,
    rateLimit: 2000,
    autoLogin: true
  });

  const result = await crawler.run();
  if (!result.success) throw new Error(result.error || 'Crawler failed');
}
