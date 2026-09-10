import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { SystemConfig } from '@forge-deals/shared/types/config';
import type { AffiliateLink } from '@forge-deals/shared/types';
import { CATEGORIES } from '@forge-deals/shared/planner/categoryRotation';
import { affiliateLinkService } from './affiliateLinkService.js';
import { BrowserConfig } from '../browser/browserConfig.js';

interface ChromeConnection {
  browser: Browser;
  context: BrowserContext;
}

interface ScrapedProduct {
  title: string;
  price: number;
  oldPrice: number;
  brand: string;
  category: string;
  url: string;
}

export class CrawlerService {
  private connection: ChromeConnection | null = null;
  private page: Page | null = null;
  private config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const cdpPort = this.config.system?.cdpPort || BrowserConfig.CDP_DEFAULT_PORT;
    const browser = await chromium.connectOverCDP(`http://${BrowserConfig.CDP_HOST}:${cdpPort}`);
    const context = browser.contexts()[0];
    if (!context) throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    this.connection = { browser, context };
    this.page = await context.newPage();
    this.page.setDefaultTimeout(BrowserConfig.ELEMENT_WAIT_TIMEOUT);
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    const email = this.config.crawler.email || process.env.LOJA_DO_MECANICO_EMAIL;
    const password = this.config.crawler.password || process.env.LOJA_DO_MECANICO_PASSWORD;

    // The Loja do Mecânico catalog is publicly accessible. Credentials are optional.
    if (!email || !password) return true;

    try {
      await this.page.goto('https://www.lojadomecanico.com.br/login', {
        waitUntil: 'domcontentloaded',
        timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
      });
      const emailInput = this.page.locator('input[placeholder*="E-mail"], input[type="email"]').first();
      if (!(await emailInput.count())) return true;
      await emailInput.fill(email);
      await this.page.getByRole('button', { name: /continuar/i }).first().click();
      const passwordInput = this.page.locator('input[placeholder*="Senha"], input[type="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: BrowserConfig.ELEMENT_WAIT_TIMEOUT });
      await passwordInput.fill(password);
      await this.page.getByRole('button', { name: /continuar/i }).first().click();
      await this.page.waitForTimeout(1500);
      return true;
    } catch (error) {
      console.warn('Login indisponível; crawler continuará no catálogo público:', error instanceof Error ? error.message : String(error));
      return true;
    }
  }

  async extractProductsFromCategory(categoryUrl?: string): Promise<AffiliateLink[]> {
    if (!this.page) throw new Error('Page not initialized');

    const url = categoryUrl || this.config.crawler.activeCategories[0]?.url || CATEGORIES[0]!.url;
    await this.gotoCatalogPage(url);
    let productUrls = await this.collectProductUrls();

    // Some category pages are redirected or rendered without product anchors.
    // Use the public home catalog as a deterministic fallback instead of returning success with zero products.
    if (productUrls.length === 0) {
      await this.gotoCatalogPage('https://www.lojadomecanico.com.br/');
      productUrls = await this.collectProductUrls();
    }

    const maxProducts = Math.max(1, this.config.crawler.maxProducts || 10);
    const products: AffiliateLink[] = [];

    for (const productUrl of productUrls.slice(0, maxProducts)) {
      const product = await this.extractProductFromUrl(productUrl);
      if (product) products.push(product);
      if (this.config.crawler.scrapingDelay > 0) {
        await this.page.waitForTimeout(this.config.crawler.scrapingDelay * 1000);
      }
    }

    return products;
  }

  private async gotoCatalogPage(url: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
    });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
  }

  private async collectProductUrls(): Promise<string[]> {
    if (!this.page) throw new Error('Page not initialized');

    const urls = await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      return links
        .map((anchor) => anchor.href)
        .filter((href) => {
          try {
            const parsed = new URL(href);
            return parsed.hostname.endsWith('lojadomecanico.com.br') && /\/produto\//i.test(parsed.pathname);
          } catch {
            return false;
          }
        });
    });

    return [...new Set(urls)];
  }

  private async extractProductFromUrl(productUrl: string): Promise<AffiliateLink | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.page.goto(productUrl, {
        waitUntil: 'domcontentloaded',
        timeout: BrowserConfig.PAGE_LOAD_TIMEOUT
      });
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);

      const data = await this.page.evaluate((): ScrapedProduct | null => {
        const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
        const parsePrice = (value: unknown) => {
          const text = clean(value);
          if (!text) return 0;
          const match = text.match(/\d[\d.]*,\d{2}|\d[\d.]*\.\d{2}|\d+/);
          if (!match) return 0;
          const raw = match[0];
          return raw.includes(',') ? Number(raw.replace(/\./g, '').replace(',', '.')) : Number(raw.replace(/,/g, ''));
        };

        const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).flatMap((node) => {
          try {
            const parsed = JSON.parse(node.textContent || 'null');
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [];
          }
        });

        const productSchema = jsonLd.find((item) => item && typeof item === 'object' && (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))));
        const offers = productSchema?.offers;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const title = clean(productSchema?.name) || clean(document.querySelector('h1')?.textContent);
        const price = Number(offer?.price) || parsePrice(document.querySelector('meta[itemprop="price"]')?.getAttribute('content')) || parsePrice(document.querySelector('[class*="price"]')?.textContent);
        const oldPrice = parsePrice(document.querySelector('[class*="old"]')?.textContent || document.querySelector('[class*="list"]')?.textContent);
        const brand = clean(typeof productSchema?.brand === 'object' ? productSchema.brand?.name : productSchema?.brand) || clean(document.querySelector('.brand')?.textContent);
        const category = clean(document.querySelector('[aria-label*="breadcrumb" i]')?.textContent) || clean(document.querySelector('.breadcrumb')?.textContent) || 'Não categorizado';
        const url = clean(productSchema?.url || offer?.url) || location.href;

        if (!title || !url || !price || price <= 0) return null;
        return {
          title,
          price,
          oldPrice: oldPrice > price ? oldPrice : price,
          brand: brand || 'Sem marca',
          category,
          url
        };
      });

      if (!data) return null;

      return {
        id: '',
        product_name: data.title,
        affiliate_url: data.url,
        original_url: data.url,
        current_price: data.price,
        previous_price: data.oldPrice,
        lowest_price: data.price,
        category: data.category,
        brand: data.brand,
        monitored: true,
        last_checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price_drop_percentage: data.oldPrice > data.price ? ((data.oldPrice - data.price) / data.oldPrice) * 100 : 0,
        opportunity_score: data.oldPrice > data.price ? Math.min(100, ((data.oldPrice - data.price) / data.oldPrice) * 200) : 0
      };
    } catch (error) {
      console.error(`Erro extraindo produto ${productUrl}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async saveProducts(products: AffiliateLink[]): Promise<void> {
    for (const product of products) {
      const existing = await affiliateLinkService.findByAffiliateUrl(product.affiliate_url);
      if (existing) {
        if (existing.current_price !== product.current_price) await affiliateLinkService.addPriceRecord(existing.id, product.current_price);
      } else {
        await affiliateLinkService.createLink(product);
      }
    }
  }

  async runCrawl(): Promise<{ success: boolean; products: AffiliateLink[]; error?: string }> {
    try {
      await this.initialize();
      await this.login();

      const category = this.config.crawler.activeCategories[0] || CATEGORIES[0]!;
      const products = await this.extractProductsFromCategory(category.url);
      if (products.length === 0) throw new Error(`Nenhum produto encontrado em ${category.url} nem no catálogo público.`);

      // Persist every valid scraped product. Scoring/publication selection happens later.
      await this.saveProducts(products);
      return { success: true, products };
    } catch (error) {
      return { success: false, products: [], error: error instanceof Error ? error.message : String(error) };
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => undefined);
      this.page = null;
    }
    // CDP attaches to an existing Chrome process. Never close that browser from the crawler.
    this.connection = null;
  }
}
