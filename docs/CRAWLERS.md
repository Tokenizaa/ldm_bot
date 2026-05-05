# Guia de Crawlers - ForgeDeals AI Bot

## 🕷️ Visão Geral

Documentação completa para implementação e manutenção de crawlers no ForgeDeals AI Bot. Foco em extração de dados de e-commerce com tratamento de autenticação e links de afiliado.

---

## 🚀 Arquitetura de Crawlers

### Stack Tecnológico
- **Playwright**: Browser automation framework
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe development
- **Supabase**: Data persistence

### Estrutura Base
```typescript
interface CrawlerConfig {
  source: string;
  loginUrl: string;
  credentials: LoginCredentials;
  selectors: Selectors;
  rateLimit: number;
  retryAttempts: number;
}

interface Selectors {
  productGrid: string;
  productLink: string;
  title: string;
  price: string;
  oldPrice: string;
  image: string;
  brand: string;
  category: string;
  shareButton: string;
  affiliateLinks: string;
}
```

---

## 🏪 Loja do Mecânico

### Configuração Completa

#### Autenticação
```typescript
const lojaDoMecanicoConfig: CrawlerConfig = {
  source: 'lojadomecanico',
  loginUrl: 'https://www.lojadomecanico.com.br/login',
  credentials: {
    email: process.env.LOJA_DO_MECANICO_EMAIL,
    password: process.env.LOJA_DO_MECANICO_PASSWORD
  },
  selectors: {
    productGrid: '.product-grid, .grid-products',
    productLink: 'a[href*="/produto/"]',
    title: 'h1',
    price: '[class*="price"]',
    oldPrice: '[class*="old"]',
    image: 'img[alt*="Imagem"]',
    brand: '.brand',
    category: '.breadcrumb a:last-child',
    shareButton: '.open-btn-compartilhar.button',
    affiliateLinks: '.generate-link'
  },
  rateLimit: 2000, // 2 segundos entre requisições
  retryAttempts: 3
};
```

#### Fluxo de Login
```typescript
async function loginLojaDoMecanico(page: Page, config: CrawlerConfig) {
  try {
    // Step 1: Página de login
    await page.goto(config.loginUrl);
    await page.waitForSelector('[placeholder*="E-mail"]', { timeout: 10000 });
    
    // Step 2: Inserir email
    await page.fill('[placeholder*="E-mail"]', config.credentials.email);
    await page.click('button:has-text("Continuar")');
    
    // Step 3: Aguardar campo de senha
    await page.waitForSelector('[placeholder*="Senha"]', { timeout: 10000 });
    
    // Step 4: Inserir senha e finalizar
    await page.fill('[placeholder*="Senha"]', config.credentials.password);
    await page.click('button:has-text("Continuar")');
    
    // Step 5: Verificar login bem-sucedido
    await page.waitForSelector('[data-user]', { timeout: 15000 });
    
    return true;
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
}
```

#### Extração de Produtos
```typescript
async function extractProductsFromPage(page: Page, config: CrawlerConfig) {
  const products = [];
  
  // Encontrar links de produtos na página
  const productLinks = await page.evaluate((selectors) => {
    const links = Array.from(document.querySelectorAll(selectors.productLink));
    return links.map(link => link.href).filter(href => href.includes('/produto/'));
  }, config.selectors);
  
  for (const productUrl of productLinks.slice(0, 10)) { // Limitar para teste
    try {
      await page.goto(productUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); // Aguardar carregamento dinâmico
      
      const productData = await page.extractProductData(config.selectors);
      
      if (productData) {
        products.push(productData);
      }
      
      // Rate limiting
      await page.waitForTimeout(config.rateLimit);
      
    } catch (error) {
      console.error(`Erro ao extrair produto ${productUrl}:`, error);
    }
  }
  
  return products;
}
```

#### Extração de Dados do Produto
```typescript
async function extractProductData(page: Page, selectors: Selectors) {
  return await page.evaluate((selectors, currentUrl) => {
    // Dados básicos do produto
    const productData = {
      title: document.querySelector(selectors.title)?.textContent?.trim(),
      price: document.querySelector(selectors.price)?.textContent?.trim(),
      oldPrice: document.querySelector(selectors.oldPrice)?.textContent?.trim(),
      image: document.querySelector(selectors.image)?.src,
      brand: document.querySelector(selectors.brand)?.textContent?.trim(),
      category: document.querySelector(selectors.category)?.textContent?.trim(),
      url: currentUrl,
      affiliateLinks: []
    };
    
    // Validação básica
    if (!productData.title || !productData.price) {
      return null;
    }
    
    // Abrir modal de compartilhamento
    const shareButton = document.querySelector(selectors.shareButton);
    if (shareButton) {
      shareButton.click();
      
      // Aguardar modal abrir
      setTimeout(() => {
        // Extrair links de afiliado
        document.querySelectorAll(selectors.affiliateLinks).forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent.trim();
          
          if (href && href.includes('utm_campaign=afiliado')) {
            productData.affiliateLinks.push({
              platform: text,
              url: href,
              hasAffiliateId: true
            });
          }
        });
      }, 1000);
    }
    
    return productData;
  }, selectors, page.url());
}
```

#### Processamento de Links de Afiliado
```typescript
function processAffiliateLinks(affiliateLinks: any[]) {
  const processedLinks = {};
  
  affiliateLinks.forEach(link => {
    const platform = link.platform.toLowerCase();
    
    if (platform.includes('whatsapp')) {
      processedLinks.whatsapp = link.url;
    } else if (platform.includes('telegram')) {
      processedLinks.telegram = link.url;
    } else if (platform.includes('facebook')) {
      processedLinks.facebook = link.url;
    }
  });
  
  return processedLinks;
}
```

---

## 🔧 Implementação Base

### Crawler Class
```typescript
import { Browser, Page, chromium } from 'playwright';

export abstract class BaseCrawler {
  protected browser: Browser;
  protected page: Page;
  protected config: CrawlerConfig;
  
  constructor(config: CrawlerConfig) {
    this.config = config;
  }
  
  async initialize() {
    this.browser = await chromium.launch({ 
      headless: false, // Para debug
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Configurar user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Configurar viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }
  
  async login(): Promise<boolean> {
    throw new Error('Login method must be implemented');
  }
  
  async navigateToCategory(categoryUrl?: string) {
    if (categoryUrl) {
      await this.page.goto(categoryUrl, { waitUntil: 'networkidle' });
    } else {
      await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle' });
    }
  }
  
  async extractProducts(): Promise<Product[]> {
    throw new Error('Extract products method must be implemented');
  }
  
  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
  
  async run(): Promise<CrawlerResult> {
    const startTime = Date.now();
    let result: CrawlerResult;
    
    try {
      await this.initialize();
      
      // Login
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Login failed');
      }
      
      // Extrair produtos
      const products = await this.extractProducts();
      
      result = {
        source: this.config.source,
        status: 'success',
        total_products: products.length,
        new_products: products.filter(p => p.isNew).length,
        updated_products: products.filter(p => p.isUpdated).length,
        ignored_products: 0,
        duration_ms: Date.now() - startTime,
        products
      };
      
    } catch (error) {
      result = {
        source: this.config.source,
        status: 'failure',
        total_products: 0,
        new_products: 0,
        updated_products: 0,
        ignored_products: 0,
        duration_ms: Date.now() - startTime,
        error_message: error.message,
        products: []
      };
    } finally {
      await this.close();
    }
    
    return result;
  }
}
```

### LojaDoMecanicoCrawler
```typescript
export class LojaDoMecanicoCrawler extends BaseCrawler {
  
  async login(): Promise<boolean> {
    try {
      await this.page.goto(this.config.loginUrl);
      
      // Step 1: Email
      await this.page.waitForSelector('[placeholder*="E-mail"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="E-mail"]', this.config.credentials.email);
      await this.page.click('button:has-text("Continuar")');
      
      // Step 2: Senha
      await this.page.waitForSelector('[placeholder*="Senha"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="Senha"]', this.config.credentials.password);
      await this.page.click('button:has-text("Continuar")');
      
      // Verificar login
      await this.page.waitForSelector('[data-user]', { timeout: 15000 });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }
  
  async extractProducts(): Promise<Product[]> {
    const products = [];
    
    // Navegar para categoria de ferramentas
    await this.page.goto('https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas');
    
    // Extrair links de produtos
    const productLinks = await this.page.$$eval('a[href*="/produto/"]', 
      links => links.map(link => link.href).filter(href => href.includes('/produto/'))
    );
    
    // Processar cada produto
    for (const productUrl of productLinks.slice(0, 5)) { // Limitar para teste
      try {
        const product = await this.extractSingleProduct(productUrl);
        if (product) {
          products.push(product);
        }
        
        await this.page.waitForTimeout(this.config.rateLimit);
      } catch (error) {
        console.error(`Error extracting product ${productUrl}:`, error);
      }
    }
    
    return products;
  }
  
  private async extractSingleProduct(productUrl: string): Promise<Product | null> {
    await this.page.goto(productUrl, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(1000);
    
    const productData = await this.page.evaluate(() => {
      const data = {
        title: document.querySelector('h1')?.textContent?.trim(),
        price: document.querySelector('[class*="price"]')?.textContent?.trim(),
        oldPrice: document.querySelector('[class*="old"]')?.textContent?.trim(),
        image: document.querySelector('img[alt*="Imagem"]')?.src,
        brand: document.querySelector('.brand')?.textContent?.trim(),
        category: document.querySelector('.breadcrumb a:last-child')?.textContent?.trim(),
        url: window.location.href,
        affiliateLinks: []
      };
      
      if (!data.title || !data.price) return null;
      
      // Clicar no botão compartilhar
      const shareButton = document.querySelector('.open-btn-compartilhar.button');
      if (shareButton) {
        shareButton.click();
        
        setTimeout(() => {
          document.querySelectorAll('.generate-link').forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();
            
            if (href && href.includes('utm_campaign=afiliado')) {
              data.affiliateLinks.push({
                platform: text,
                url: href,
                hasAffiliateId: true
              });
            }
          });
        }, 1000);
      }
      
      return data;
    });
    
    if (!productData) return null;
    
    // Processar e formatar dados
    return this.formatProductData(productData);
  }
  
  private formatProductData(rawData: any): Product {
    // Limpar e formatar preço
    const price = this.parsePrice(rawData.price);
    const oldPrice = rawData.oldPrice ? this.parsePrice(rawData.oldPrice) : null;
    const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
    
    // Gerar slug
    const slug = rawData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    // Processar links de afiliado
    const affiliateLinks = this.processAffiliateLinks(rawData.affiliateLinks);
    
    return {
      id: '', // Será gerado pelo banco
      title: rawData.title,
      slug,
      image: rawData.image,
      price,
      old_price: oldPrice || 0,
      discount,
      category: rawData.category,
      brand: rawData.brand,
      affiliate_url: affiliateLinks.whatsapp || '',
      original_url: rawData.url,
      active: true,
      is_hot: discount > 20,
      views: 0,
      clicks: 0,
      ctr: 0,
      created_at: new Date().toISOString()
    };
  }
  
  private parsePrice(priceText: string): number {
    return parseFloat(priceText
      .replace(/[^\d,]/g, '')
      .replace(',', '.')
    );
  }
  
  private processAffiliateLinks(links: any[]): { [key: string]: string } {
    const processed: { [key: string]: string } = {};
    
    links.forEach(link => {
      const platform = link.platform.toLowerCase();
      if (platform.includes('whatsapp')) processed.whatsapp = link.url;
      else if (platform.includes('telegram')) processed.telegram = link.url;
      else if (platform.includes('facebook')) processed.facebook = link.url;
    });
    
    return processed;
  }
}
```

---

## 📊 Execução e Monitoramento

### Serviço de Crawler
```typescript
export class CrawlerService {
  private crawlers: Map<string, BaseCrawler> = new Map();
  
  registerCrawler(name: string, crawler: BaseCrawler) {
    this.crawlers.set(name, crawler);
  }
  
  async runCrawler(name: string): Promise<CrawlerResult> {
    const crawler = this.crawlers.get(name);
    if (!crawler) {
      throw new Error(`Crawler ${name} not found`);
    }
    
    const result = await crawler.run();
    
    // Salvar log no banco
    await this.saveCrawlerLog(result);
    
    // Processar produtos
    if (result.status === 'success') {
      await this.processProducts(result.products);
    }
    
    return result;
  }
  
  private async saveCrawlerLog(result: CrawlerResult) {
    // Implementar salvamento no Supabase
    const { data, error } = await supabase
      .from('crawler_logs')
      .insert({
        source: result.source,
        status: result.status,
        total_products: result.total_products,
        new_products: result.new_products,
        updated_products: result.updated_products,
        ignored_products: result.ignored_products,
        duration_ms: result.duration_ms,
        error_message: result.error_message
      });
    
    if (error) {
      console.error('Error saving crawler log:', error);
    }
  }
  
  private async processProducts(products: Product[]) {
    for (const product of products) {
      // Verificar se produto já existe
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .single();
      
      if (existing) {
        // Atualizar produto existente
        await supabase
          .from('products')
          .update({
            price: product.price,
            old_price: product.old_price,
            discount: product.discount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Inserir novo produto
        await supabase
          .from('products')
          .insert(product);
      }
    }
  }
}
```

### Agendamento
```typescript
import cron from 'node-cron';

export class CrawlerScheduler {
  private crawlerService: CrawlerService;
  
  constructor(crawlerService: CrawlerService) {
    this.crawlerService = crawlerService;
  }
  
  startScheduling() {
    // Executar a cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled crawler: lojadomecanico');
      
      try {
        const result = await this.crawlerService.runCrawler('lojadomecanico');
        console.log('Crawler result:', result);
      } catch (error) {
        console.error('Scheduled crawler error:', error);
      }
    });
    
    // Executar a cada meia-noite
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily cleanup and analysis');
      await this.dailyMaintenance();
    });
  }
  
  private async dailyMaintenance() {
    // Limpar produtos antigos
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await supabase
      .from('products')
      .update({ active: false })
      .lt('created_at', thirtyDaysAgo.toISOString());
    
    // Gerar relatório diário
    await this.generateDailyReport();
  }
}
```

---

## 🛠️ Configuração e Deploy

### Environment Variables
```bash
# Crawler Configuration
CRAWLER_HEADLESS=true
CRAWLER_TIMEOUT=30000
CRAWLER_RATE_LIMIT=2000

# Credentials (em produção usar secrets)
LOJA_DO_MECANICO_EMAIL=your-email
LOJA_DO_MECANICO_PASSWORD=your-password

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

### Docker Configuration
```dockerfile
FROM node:18-alpine

# Instalar dependências do Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### PM2 Configuration
```json
{
  "apps": [{
    "name": "forgedeals-crawler",
    "script": "dist/crawler-service.js",
    "instances": 1,
    "exec_mode": "fork",
    "env": {
      "NODE_ENV": "production",
      "CRAWLER_HEADLESS": "true"
    },
    "log_file": "logs/crawler.log",
    "error_file": "logs/crawler-error.log",
    "out_file": "logs/crawler-out.log",
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
    "merge_logs": true,
    "max_memory_restart": "1G"
  }]
}
```

---

## 🔍 Debug e Troubleshooting

### Logging Estruturado
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/crawler-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/crawler.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Screenshots para Debug
```typescript
async function takeScreenshot(page: Page, filename: string) {
  await page.screenshot({ 
    path: `screenshots/${filename}-${Date.now()}.png`,
    fullPage: true 
  });
}

// Uso no crawler
try {
  await this.page.goto(productUrl);
} catch (error) {
  await takeScreenshot(this.page, 'error-navigation');
  throw error;
}
```

### Testes Unitários
```typescript
import { LojaDoMecanicoCrawler } from './crawlers/LojaDoMecanicoCrawler';

describe('LojaDoMecanicoCrawler', () => {
  let crawler: LojaDoMecanicoCrawler;
  
  beforeEach(() => {
    crawler = new LojaDoMecanicoCrawler(mockConfig);
  });
  
  test('should login successfully', async () => {
    const result = await crawler.login();
    expect(result).toBe(true);
  });
  
  test('should extract product data', async () => {
    const products = await crawler.extractProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty('title');
    expect(products[0]).toHaveProperty('price');
  });
});
```

---

## 📈 Performance e Otimização

### Rate Limiting
```typescript
class RateLimiter {
  private requests: number[] = [];
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

### Cache de Produtos
```typescript
class ProductCache {
  private cache = new Map<string, Product>();
  
  get(slug: string): Product | undefined {
    const product = this.cache.get(slug);
    if (product) {
      // Verificar se cache não está expirado (1 hora)
      const age = Date.now() - new Date(product.updated_at).getTime();
      if (age < 3600000) {
        return product;
      }
    }
    return undefined;
  }
  
  set(slug: string, product: Product) {
    this.cache.set(slug, product);
  }
}
```

---

## 🚀 Boas Práticas

### 1. Tratamento de Erros
- Sempre implementar retry logic
- Log estruturado para debugging
- Screenshots automáticos em erros

### 2. Performance
- Rate limiting respeitoso
- Cache inteligente
- Paralelização controlada

### 3. Manutenção
- Seletores robustos
- Monitoramento contínuo
- Testes automatizados

### 4. Segurança
- Credentials em environment variables
- User agents rotativos
- Proxy rotation (se necessário)

---

## 📚 Referências

- [Playwright Documentation](https://playwright.dev/)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript)
- [Node-cron Documentation](https://github.com/node-cron/node-cron)
- [Winston Logging](https://github.com/winstonjs/winston)

---

*Documentação atualizada: Maio 2026*
