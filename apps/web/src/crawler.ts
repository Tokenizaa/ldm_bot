import { Page } from 'playwright';
import { newPage, randomDelay } from './browser';

export interface Product {
  id?: string;
  title: string;
  price: number;
  old_price: number;
  image: string;
  affiliate_url: string;
  category: string;
  brand: string;
  description?: string;
  technical_specs?: string;
}

export interface LojaDoMecanicoConfig {
  email: string;
  password: string;
  rateLimit?: number;
  autoLogin?: boolean;
}

export class LojaDoMecanicoCrawler {
  private page: Page | null = null;
  private config: LojaDoMecanicoConfig;

  constructor(config: LojaDoMecanicoConfig) {
    this.config = {
      rateLimit: 2000,
      autoLogin: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    this.page = await newPage();
    await this.page.setViewportSize({ width: 1366, height: 768 });
    this.page.setDefaultTimeout(10000);
  }

  async isLoggedIn(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Verificar se já está logado acessando página principal
      await this.page.goto('https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await randomDelay(1000, 2000);
      
      const currentUrl = this.page.url();
      
      // Se está em página de login, não está logado
      if (currentUrl.includes('/login')) {
        return false;
      }

      // Verificar se tem elemento de usuário logado
      const hasUserElement = await this.page.locator('[data-user]').count() > 0;
      if (hasUserElement) {
        console.log('✅ Já está logado na Loja do Mecânico');
        return true;
      }

      // Verificar outros indicadores de login
      const hasLogoutButton = await this.page.locator('button:has-text("Sair"), a:has-text("Sair")').count() > 0;
      const hasUserMenu = await this.page.locator('[data-test="user-menu"], .user-menu').count() > 0;
      
      return hasLogoutButton || hasUserMenu;
      
    } catch (error) {
      console.log('Erro ao verificar login:', error);
      return false;
    }
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // PRIMEIRO: Verificar se já está logado
      if (await this.isLoggedIn()) {
        return true;
      }

      console.log('🔐 Não está logado, fazendo login...');
      
      // Tentar acessar o site com retry
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          await this.page.goto('https://www.lojadomecanico.com.br/login', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          break; // Se funcionou, sai do loop
        } catch (error) {
          if (attempts === maxAttempts) throw error;
          console.log(`Tentativa ${attempts} falhou, tentando novamente...`);
          await randomDelay(2000, 5000);
        }
      }

      await this.page.waitForSelector('[placeholder*="E-mail"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="E-mail"]', this.config.email);
      await randomDelay(1000, 2000);
      await this.page.click('button:has-text("Continuar")');

      await this.page.waitForSelector('[placeholder*="Senha"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="Senha"]', this.config.password);
      await randomDelay(1000, 2000);
      await this.page.click('button:has-text("Continuar")');

      await this.page.waitForSelector('[data-user]', { timeout: 15000 });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async extractProductsFromCategory(
    categoryUrl?: string
  ): Promise<Product[]> {
    const url = categoryUrl || 'https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas';
    if (!this.page) throw new Error('Page not initialized');

    const products: Product[] = [];

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

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

  private async extractProductFromUrl(productUrl: string): Promise<Product | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await this.page.waitForTimeout(1000);

      const productData = await this.page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() || '';
        const price = (document.querySelector('[class*="price"]') as HTMLElement | null)?.textContent?.trim() || '';
        const oldPrice = (document.querySelector('[class*="old"]') as HTMLElement | null)?.textContent?.trim() || '';
        const image = (document.querySelector('img') as HTMLImageElement | null)?.src;
        const brand = (document.querySelector('.brand') as HTMLElement | null)?.textContent?.trim();
        const category = (document.querySelector('.breadcrumb a:last-child') as HTMLElement | null)?.textContent?.trim();
        
        // Extrair descrição do produto
        const descriptionElement = document.querySelector('[class*="descricao"], .description, .product-description, #descricao');
        let description = '';
        if (descriptionElement) {
          description = descriptionElement.textContent?.trim() || '';
        } else {
          // Fallback: procurar por seção de descrição
          const descSection = document.querySelector('h2')?.nextElementSibling;
          if (descSection && descSection.textContent?.includes('Descrição do produto')) {
            description = descSection.textContent?.replace('Descrição do produto', '').trim() || '';
          }
        }
        
        // Extrair ficha técnica
        const technicalSpecsElement = document.querySelector('[class*="ficha"], .specs, .technical-specs, .product-specs, table');
        let technicalSpecs = '';
        if (technicalSpecsElement) {
          technicalSpecs = technicalSpecsElement.textContent?.trim() || '';
        } else {
          // Fallback: procurar por tabelas ou listas de especificações
          const tables = document.querySelectorAll('table');
          tables.forEach(table => {
            const text = table.textContent?.trim() || '';
            if (text.includes('Especificações') || text.includes('Características') || text.includes('Técnica')) {
              technicalSpecs = text;
            }
          });
        }
        
        // Buscar link de compartilhamento afiliado
        let affiliateUrl = location.href;
        
        // Procurar pelo input com o link de afiliado completo (estrutura encontrada)
        const affiliateInput = document.querySelector('input.url-item.position-absolute');
        if (affiliateInput) {
          const inputElement = affiliateInput as HTMLInputElement;
          const inputValue = inputElement.value;
          
          // Verificar se o input contém URL com tracking de afiliado
          if (inputValue && inputValue.includes('lojadomecanico.com.br') && inputValue.includes('utm_campaign=afiliado')) {
            affiliateUrl = inputValue;
            console.log('Link afiliado encontrado no input:', inputValue);
          }
        }
        
        // Fallback: procurar por outros elementos com links de afiliado
        if (affiliateUrl === location.href) {
          const generatedLinks = document.querySelectorAll('.generate-link, [data-affiliate-link], [data-share]');
          for (const link of generatedLinks) {
            const linkElement = link as HTMLElement;
            const linkValue = linkElement.textContent || (linkElement as HTMLInputElement)?.value;
            
            if (linkValue && linkValue.includes('lojadomecanico.com.br') && linkValue.includes('utm_campaign=afiliado')) {
              affiliateUrl = linkValue;
              break;
            }
          }
        }
        
        // Último fallback: verificar se URL atual já tem tracking
        if (affiliateUrl === location.href) {
          const urlParams = new URLSearchParams(location.search);
          const utmCampaign = urlParams.get('utm_campaign');
          if (utmCampaign && utmCampaign.includes('afiliado')) {
            affiliateUrl = location.href;
          }
        }

        return { title, price, oldPrice, image, brand, category, description, technicalSpecs, url: location.href, affiliateUrl };
      });

      if (!productData.title || !productData.price) return null;

      const product: Product = {
        title: productData.title,
        price: this.parsePrice(productData.price),
        old_price: this.parsePrice(productData.oldPrice),
        image: productData.image || '',
        affiliate_url: productData.affiliateUrl || productData.url,
        category: productData.category || '',
        brand: productData.brand || '',
        description: productData.description || '',
        technical_specs: productData.technicalSpecs || ''
      };

      return product;
    } catch (error) {
      console.error('Failed to extract product:', error);
      return null;
    }
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    return parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));
  }

  async run(categoryUrl?: string): Promise<{ success: boolean; products: Product[]; error?: string }> {
    try {
      // Inicializar página
      await this.initialize();

      // Verificar login
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn && this.config.autoLogin) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          console.warn('Login falhou, tentando extrair produtos sem autenticação');
        }
      }

      // Extrair produtos da categoria
      const products = await this.extractProductsFromCategory(categoryUrl);
      
      return {
        success: true,
        products
      };
    } catch (error) {
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }
}

export async function runLojaDoMecanicoCrawler(categoryUrl?: string): Promise<Product[]> {
  if (!process.env.LOJA_DO_MECANICO_EMAIL || !process.env.LOJA_DO_MECANICO_PASSWORD) {
    throw new Error('Missing required env vars: LOJA_DO_MECANICO_EMAIL / LOJA_DO_MECANICO_PASSWORD');
  }

  const crawler = new LojaDoMecanicoCrawler({
    email: process.env.LOJA_DO_MECANICO_EMAIL,
    password: process.env.LOJA_DO_MECANICO_PASSWORD,
    rateLimit: 2000,
    autoLogin: true
  });

  const result = await crawler.run(categoryUrl);
  if (!result.success) throw new Error(result.error || 'Crawler failed');
  
  return result.products;
}
