import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { SystemConfig } from '@forge-deals/shared/types/config';
import type { AffiliateLink } from '@forge-deals/shared/types';
import { ProductScorer } from '@forge-deals/shared/planner/productScore';
import { AntiRepetition } from '@forge-deals/shared/planner/antiRepetition';
import { CategoryRotation, CATEGORIES } from '@forge-deals/shared/planner/categoryRotation';
import { affiliateLinkService } from './affiliateLinkService.js';
import { BrowserConfig } from '../browser/browserConfig.js';

interface ChromeConnection {
  browser: Browser;
  context: BrowserContext;
  isConnected: boolean;
}

export class CrawlerService {
  private connection: ChromeConnection | null = null;
  private page: Page | null = null;
  private config: SystemConfig;
  private scorer = new ProductScorer();
  private antiRepetition = new AntiRepetition();
  private categoryRotation = new CategoryRotation();

  constructor(config: SystemConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const cdpPort = this.config.system?.cdpPort || BrowserConfig.CDP_DEFAULT_PORT;
    const browser = await chromium.connectOverCDP(`http://${BrowserConfig.CDP_HOST}:${cdpPort}`);
    const context = browser.contexts()[0];
    if (!context) {
      await browser.close().catch(() => undefined);
      throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    }
    this.connection = { browser, context, isConnected: true };
    this.page = await context.newPage();
    await this.setupPage();
  }

  private async setupPage(): Promise<void> {
    if (!this.page) return;
    await this.page.setViewportSize(BrowserConfig.DEFAULT_VIEWPORT);
    await this.page.setExtraHTTPHeaders(BrowserConfig.DEFAULT_HEADERS);
    this.page.setDefaultTimeout(BrowserConfig.ELEMENT_WAIT_TIMEOUT);
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    try {
      const currentUrl = this.page.url();
      if (currentUrl.includes('lojadomecanico.com.br') && !currentUrl.includes('/login')) {
        if (await this.page.locator('[data-user]').count() > 0) return true;
      }
      await this.page.goto('https://www.lojadomecanico.com.br/login', { waitUntil: 'networkidle', timeout: BrowserConfig.PAGE_LOAD_TIMEOUT });
      await this.page.waitForSelector('[placeholder*="E-mail"]', { timeout: BrowserConfig.ELEMENT_WAIT_TIMEOUT });
      await this.page.fill('[placeholder*="E-mail"]', this.config.crawler.email || process.env.LOJA_DO_MECANICO_EMAIL || '');
      await this.page.click('button:has-text("Continuar")');
      await this.page.waitForSelector('[placeholder*="Senha"]', { timeout: BrowserConfig.ELEMENT_WAIT_TIMEOUT });
      await this.page.fill('[placeholder*="Senha"]', this.config.crawler.password || process.env.LOJA_DO_MECANICO_PASSWORD || '');
      await this.page.click('button:has-text("Continuar")');
      await this.page.waitForSelector('[data-user]', { timeout: 15000 });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async extractProductsFromCategory(categoryUrl?: string): Promise<AffiliateLink[]> {
    if (!this.page) throw new Error('Page not initialized');
    const url = categoryUrl || this.config.crawler.activeCategories[0]?.url || CATEGORIES[0]!.url;
    const products: AffiliateLink[] = [];
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: BrowserConfig.PAGE_LOAD_TIMEOUT });
    const productUrls: string[] = await this.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/produto/"]')) as HTMLAnchorElement[];
      return anchors.map((a) => a.href).filter(Boolean);
    });
    const maxProducts = this.config.crawler.maxProducts || 10;
    const rateLimit = this.config.crawler.scrapingDelay * 1000 || 2000;
    for (const productUrl of productUrls.slice(0, maxProducts)) {
      const product = await this.extractProductFromUrl(productUrl);
      if (product) products.push(product);
      if (rateLimit) await this.page.waitForTimeout(rateLimit);
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
        const brand = (document.querySelector('.brand') as HTMLElement | null)?.textContent?.trim();
        const category = (document.querySelector('.breadcrumb a:last-child') as HTMLElement | null)?.textContent?.trim();
        return { title, price, oldPrice, brand, category, url: location.href };
      });
      if (!productData.title || !productData.price) return null;
      const currentPrice = this.parsePrice(productData.price);
      const oldPrice = productData.oldPrice ? this.parsePrice(productData.oldPrice) : currentPrice;
      return {
        id: '', product_name: productData.title, affiliate_url: productData.url, original_url: productData.url,
        current_price: currentPrice, previous_price: oldPrice, lowest_price: currentPrice,
        category: productData.category || 'Não categorizado', brand: productData.brand || 'Sem marca',
        monitored: true, last_checked_at: new Date().toISOString(), created_at: new Date().toISOString(),
        price_drop_percentage: oldPrice > currentPrice ? ((oldPrice - currentPrice) / oldPrice) * 100 : 0,
        opportunity_score: oldPrice > currentPrice ? Math.min(100, ((oldPrice - currentPrice) / oldPrice) * 200) : 0
      };
    } catch (error) {
      console.error(`Error extracting product from ${productUrl}:`, error);
      return null;
    }
  }

  private parsePrice(priceText: string): number {
    return priceText ? parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
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
      if (!await this.login()) throw new Error('Falha no login');
      const activeCategory = this.categoryRotation.chooseRandomCategory();
      const products = await this.extractProductsFromCategory(activeCategory.url);
      if (products.length === 0) return { success: true, products: [] };
      const scoredProducts = products.map((product) => this.scorer.calculateScore({
        id: product.id, title: product.product_name, price: product.current_price, old_price: product.previous_price,
        image: '', affiliate_url: product.affiliate_url, category: product.category, brand: product.brand,
        description: '', technical_specs: ''
      }, [], []));
      const filteredProducts = this.scorer.filterByMinScore(scoredProducts, this.config.crawler.minScore || 30);
      const availableProducts = this.antiRepetition.filterAvailableProducts(filteredProducts.map((product) => ({ id: product.affiliate_url, categoryId: product.category })));
      const availableUrls = new Set(availableProducts.map((product) => product.id));
      const selectedProducts = products.filter((product) => availableUrls.has(product.affiliate_url));
      if (selectedProducts.length > 0) await this.saveProducts(selectedProducts);
      return { success: true, products: selectedProducts };
    } catch (error) {
      return { success: false, products: [], error: error instanceof Error ? error.message : 'Erro desconhecido' };
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    if (this.page) { await this.page.close().catch(() => undefined); this.page = null; }
    if (this.connection) { await this.connection.browser.close().catch(() => undefined); this.connection = null; }
  }
}
