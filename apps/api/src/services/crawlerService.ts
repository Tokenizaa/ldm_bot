import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { SystemConfig } from '../../web/src/types/config';
import type { AffiliateLink } from '@forge-deals/shared/types';
import { ProductScorer } from '../../web/src/planner/productScore';
import { AntiRepetition } from '../../web/src/planner/antiRepetition';
import { CategoryRotation, CATEGORIES } from '../../web/src/planner/categoryRotation';
import { getSupabaseAdmin } from './supabaseAdmin';
import { affiliateLinkService } from '../../workers/src/services/affiliateLinkService';

// Interfaces from worker crawler
interface ChromeConnection {
  browser: Browser;
  context: BrowserContext;
  isConnected: boolean;
}

interface LojaDoMecanicoConfig {
  email: string;
  password: string;
  rateLimit?: number;
  autoLogin?: boolean;
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
    // Connect to existing Chrome CDP
    const cdpUrl = `http://localhost:${this.config.system?.cdpPort || 9222}`;
    const browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();
    
    if (!contexts.length) {
      throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    }

    const context = contexts[0];
    
    this.connection = {
      browser,
      context,
      isConnected: true
    };

    // Create page
    this.page = await context.newPage();
    await this.setupPage();
  }

  private async setupPage(): Promise<void> {
    if (!this.page) return;
    
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    this.page.setDefaultTimeout(30000);
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Check if already logged in
      const currentUrl = this.page.url();
      if (currentUrl.includes('lojadomecanico.com.br') && !currentUrl.includes('/login')) {
        const hasUserElement = await this.page.locator('[data-user]').count() > 0;
        if (hasUserElement) return true;
      }

      await this.page.goto('https://www.lojadomecanico.com.br/login', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.page.waitForSelector('[placeholder*="E-mail"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="E-mail"]', this.config.crawler.email || process.env.LOJA_DO_MECANICO_EMAIL!);
      await this.page.click('button:has-text("Continuar")');

      await this.page.waitForSelector('[placeholder*="Senha"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="Senha"]', this.config.crawler.password || process.env.LOJA_DO_MECANICO_PASSWORD!);
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

    const url = categoryUrl || this.config.crawler.activeCategories[0]?.url || CATEGORIES[0].url;
    const products: AffiliateLink[] = [];

    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Collect product links
    const productUrls: string[] = await this.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/produto/"]')) as HTMLAnchorElement[];
      return anchors.map(a => a.href).filter(Boolean);
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
      await this.page.goto(productUrl, { waitUntil: 'networkidle', timeout: 30000 });
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
    } catch (error) {
      console.error(`Error extracting product from ${productUrl}:`, error);
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

  async runCrawl(): Promise<{ success: boolean; products: AffiliateLink[]; error?: string }> {
    try {
      await this.initialize();

      const loginSuccess = await this.login();
      if (!loginSuccess) throw new Error('Falha no login');

      // Apply category rotation
      const activeCategory = this.categoryRotation.chooseRandomCategory();
      const products = await this.extractProductsFromCategory(activeCategory.url);
      
      if (products.length === 0) {
        return { success: true, products: [] };
      }

      // Apply scoring
      const recentCategories: string[] = []; // Could load from DB
      const recentBrands: string[] = []; // Could load from DB
      
      const scoredProducts = products.map(product => 
        this.scorer.calculateScore(
          {
            id: product.id,
            title: product.product_name,
            price: product.current_price,
            old_price: product.previous_price,
            image: '',
            affiliate_url: product.affiliate_url,
            category: product.category,
            brand: product.brand,
            description: '',
            technical_specs: ''
          },
          recentCategories,
          recentBrands
        )
      );

      // Filter by min score
      const minScore = this.config.crawler.minScore || 30;
      const filteredProducts = this.scorer.filterByMinScore(scoredProducts, minScore);

      // Apply anti-repetition
      const availableProducts = this.antiRepetition.filterAvailableProducts(
        filteredProducts.map(p => ({ id: p.affiliate_url, categoryId: p.category }))
      );

      // Save to database
      if (availableProducts.length > 0) {
        await this.saveProducts(availableProducts);
      }

      return { success: true, products: availableProducts };
    } catch (error) {
      return { 
        success: false, 
        products: [], 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.connection) {
      await this.connection.browser.close();
      this.connection = null;
    }
  }
}