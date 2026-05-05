# Guia de Desenvolvimento - ForgeDeals AI Bot

## 🚀 Visão Geral

Guia completo para desenvolvedores trabalhando no ForgeDeals AI Bot, incluindo setup local, arquitetura, padrões de código e melhores práticas.

---

## 🛠️ Setup Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Git
- VS Code (recomendado)
- Conta Supabase
- Google Gemini API Key

### Instalação
```bash
# 1. Clonar repositório
git clone <repository-url>
cd ldm_bot

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local

# 4. Setup do Supabase
# - Criar projeto em https://supabase.com
# - Executar script supabase_setup.sql no Editor SQL
# - Configurar variáveis no .env.local

# 5. Iniciar desenvolvimento
npm run dev
```

### .env.local
```bash
# Desenvolvimento
NODE_ENV=development
PORT=3000

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# n8n (opcional)
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook

# App URL
APP_URL=http://localhost:3000
```

---

## 🏗️ Estrutura do Projeto

### Organização de Arquivos
```
ldm_bot/
├── docs/                    # Documentação
│   ├── README.md
│   ├── API.md
│   ├── CRAWLERS.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
├── src/
│   ├── components/          # Componentes React
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductDetails.tsx
│   │   ├── Automation.tsx
│   │   ├── CrawlerEngine.tsx
│   │   ├── PlaywrightWorker.tsx
│   │   └── AffiliateWorker.tsx
│   ├── services/           # Serviços de API
│   │   ├── productService.ts
│   │   ├── crawlerService.ts
│   │   ├── aiService.ts
│   │   └── publishService.ts
│   ├── lib/               # Utilitários
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/             # React hooks
│   │   └── useProducts.ts
│   ├── types.ts           # Tipos TypeScript
│   ├── main.tsx          # Entry point
│   └── App.tsx           # Componente principal
├── server.ts             # Servidor Express
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

### Convenções de Nomenclatura
- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Funções**: camelCase (`getProducts`)
- **Variáveis**: camelCase (`productList`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Arquivos**: kebab-case (`product-service.ts`)

---

## 💻 Padrões de Código

### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### React Component Pattern
```typescript
// Componente funcional com TypeScript
interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  className
}) => {
  // Hooks no topo
  const [isLoading, setIsLoading] = useState(false);
  const { formatCurrency } = useUtils();
  
  // Event handlers
  const handleView = useCallback(() => {
    onView?.(product);
  }, [product, onView]);
  
  // Render condicional
  if (!product) return null;
  
  return (
    <div className={cn('product-card', className)}>
      <h3>{product.title}</h3>
      <p>{formatCurrency(product.price)}</p>
      <button onClick={handleView}>
        Ver Detalhes
      </button>
    </div>
  );
};
```

### Service Pattern
```typescript
// Serviço com tratamento de erros
export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback para dados mock
      return MOCK_PRODUCTS;
    }
  },
  
  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }
};
```

### Hook Pattern
```typescript
// Custom hook com TypeScript
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    productService.getProducts()
      .then(setProducts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  
  return {
    products,
    loading,
    error,
    refetch
  };
};
```

---

## 🎨 UI/UX Patterns

### TailwindCSS Config
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        dark: {
          primary: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
```

### Component Base
```typescript
// Base component com estilos consistentes
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default'
}) => {
  const baseClasses = 'rounded-lg p-6 transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white shadow-md',
    premium: 'bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20'
  };
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
};
```

### Responsive Design
```typescript
// Grid responsivo para produtos
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>

// Sidebar responsivo
<aside className="
  fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full lg:relative lg:translate-x-0
  bg-dark-primary border-r border-dark-tertiary
  transition-transform duration-300 ease-in-out
">
  <Sidebar />
</aside>
```

---

## 🗄️ Database Patterns

### Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Types para as tabelas
export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at'>;
        Update: Partial<Product>;
      }
      crawler_logs: {
        Row: CrawlerLog;
        Insert: Omit<CrawlerLog, 'id' | 'created_at'>;
        Update: Partial<CrawlerLog>;
      }
    };
  };
};
```

### Query Patterns
```typescript
// Query com tipagem forte
async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('active', true)
    .order('ai_score', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Query com paginação
async function getProductsPaginated(
  page: number = 1,
  limit: number = 20
): Promise<{ products: Product[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const [{ data: products }, { count }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('count', { count: 'exact', head: true })
  ]);
  
  return {
    products: products || [],
    total: count || 0
  };
}
```

### Realtime Subscriptions
```typescript
// Realtime updates
export const useRealtimeProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel('products')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new as Product : p)
            );
          }
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, []);
  
  return products;
};
```

---

## 🤖 AI Integration Patterns

### Gemini AI Service
```typescript
// lib/aiService.ts
import { GoogleGenerativeAI } from '@google/genai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const aiService = {
  async analyzeProduct(product: Partial<Product>): Promise<AIAnalysis> {
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Analise o seguinte produto e forneça:
      1. Uma descrição atrativa (máximo 200 caracteres)
      2. Um score de oportunidade (0-100)
      3. Uma análise breve do potencial de venda
      4. Texto otimizado para Telegram
      
      Produto: ${product.title}
      Preço: R$${product.price}
      Categoria: ${product.category}
      Marca: ${product.brand}
      
      Responda em formato JSON:
      {
        "ai_description": "...",
        "ai_score": 85,
        "ai_analysis": "...",
        "telegram_copy": "..."
      }
    `;
    
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return JSON.parse(response);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('Failed to analyze product');
    }
  }
};
```

### AI-Powered Features
```typescript
// Componente com AI integration
export const AIInsights: React.FC<{ product: Product }> = ({ product }) => {
  const [insights, setInsights] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  const generateInsights = async () => {
    setLoading(true);
    try {
      const analysis = await aiService.analyzeProduct(product);
      setInsights(analysis);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card variant="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <button 
          onClick={generateInsights}
          disabled={loading}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>
      
      {insights && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-green-400">Score: {insights.ai_score}/100</h4>
            <p className="text-sm text-gray-300">{insights.ai_analysis}</p>
          </div>
          
          <div>
            <h4 className="font-medium">Telegram Copy:</h4>
            <div className="bg-dark-tertiary p-3 rounded-lg text-sm">
              {insights.telegram_copy}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
```

---

## 🕷️ Crawler Development

### Base Crawler Class
```typescript
// crawlers/BaseCrawler.ts
import { Browser, Page, chromium } from 'playwright';

export abstract class BaseCrawler {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.setupPage();
  }
  
  protected async setupPage(): Promise<void> {
    if (!this.page) return;
    
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }
  
  abstract login(): Promise<boolean>;
  abstract extractProducts(): Promise<Product[]>;
  
  async close(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}
```

### Testing Crawlers
```typescript
// tests/crawlers/LojaDoMecanicoCrawler.test.ts
import { LojaDoMecanicoCrawler } from '../../src/crawlers/LojaDoMecanicoCrawler';

describe('LojaDoMecanicoCrawler', () => {
  let crawler: LojaDoMecanicoCrawler;
  
  beforeEach(() => {
    crawler = new LojaDoMecanicoCrawler();
  });
  
  afterEach(async () => {
    await crawler.close();
  });
  
  test('should initialize successfully', async () => {
    await crawler.initialize();
    expect(crawler.browser).toBeTruthy();
    expect(crawler.page).toBeTruthy();
  });
  
  test('should login with valid credentials', async () => {
    await crawler.initialize();
    const result = await crawler.login();
    expect(result).toBe(true);
  });
  
  test('should extract products from category page', async () => {
    await crawler.initialize();
    await crawler.login();
    
    const products = await crawler.extractProducts();
    expect(products.length).toBeGreaterThan(0);
    
    const firstProduct = products[0];
    expect(firstProduct).toHaveProperty('title');
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('affiliate_url');
  });
});
```

---

## 🧪 Testing Strategy

### Jest Configuration
```javascript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Component Testing
```typescript
// src/tests/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@components/ProductCard';
import { mockProduct } from '../mocks/products';

describe('ProductCard', () => {
  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText(/R\$299,90/)).toBeInTheDocument();
  });
  
  test('calls onView when button is clicked', () => {
    const mockOnView = jest.fn();
    render(<ProductCard product={mockProduct} onView={mockOnView} />);
    
    fireEvent.click(screen.getByText('Ver Detalhes'));
    expect(mockOnView).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Integration Testing
```typescript
// src/tests/integration/api.test.ts
import { request } from 'supertest';
import { app } from '../../server';

describe('API Integration', () => {
  test('POST /api/public/ingest should create product', async () => {
    const productData = {
      title: 'Test Product',
      price: 99.90,
      affiliate_url: 'https://example.com/aff/123'
    };
    
    const response = await request(app)
      .post('/api/public/ingest')
      .send(productData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(productData.title);
  });
});
```

---

## 🔧 Debug e Troubleshooting

### VS Code Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Crawler",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/crawlers/index.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development",
        "CRAWLER_HEADLESS": "false"
      }
    }
  ]
}
```

### Common Issues e Solutions

#### 1. Supabase Connection
```typescript
// Verificar configuração
if (!isSupabaseConfigured) {
  console.warn('Supabase not configured, using mock data');
}

// Testar conexão
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    console.log('Supabase connection:', error ? 'Failed' : 'Success');
  } catch (error) {
    console.error('Connection test failed:', error);
  }
};
```

#### 2. Playwright Issues
```typescript
// Timeout handling
const navigateWithRetry = async (page: Page, url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1} for ${url}`);
      await page.waitForTimeout(2000);
    }
  }
};

// Screenshot em erros
const takeErrorScreenshot = async (page: Page, name: string) => {
  await page.screenshot({
    path: `screenshots/error-${name}-${Date.now()}.png`,
    fullPage: true
  });
};
```

#### 3. Memory Leaks
```typescript
// Limpeza de recursos
class CrawlerManager {
  private crawlers = new Map<string, BaseCrawler>();
  
  async runCrawler(name: string): Promise<void> {
    const crawler = this.crawlers.get(name);
    if (!crawler) return;
    
    try {
      await crawler.initialize();
      const products = await crawler.extractProducts();
      // Process products...
    } finally {
      await crawler.close();
    }
  }
  
  async cleanup(): Promise<void> {
    for (const crawler of this.crawlers.values()) {
      await crawler.close();
    }
    this.crawlers.clear();
  }
}
```

---

## 📈 Performance Optimization

### Code Splitting
```typescript
// Lazy loading de componentes
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const CrawlerEngine = lazy(() => import('./pages/CrawlerEngine'));

// No App.tsx
<Suspense fallback={<div>Loading...</div>}>
  <Route path="/produtos/:id" element={<ProductDetails />} />
  <Route path="/crawler" element={<CrawlerEngine />} />
</Suspense>
```

### Memoization
```typescript
// Component memoizado
export const ProductCard = React.memo<ProductCardProps>(({ product }) => {
  // Component logic...
});

// Hook memoizado
export const useProducts = () => {
  const getProducts = useCallback(async () => {
    // Cache logic...
  }, []);
  
  // Rest of hook...
};
```

### Bundle Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          charts: ['recharts']
        }
      }
    }
  }
});
```

---

## 🚀 Scripts e Comandos Úteis

### package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "tsc --noEmit && eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css,md}",
    "crawler:dev": "tsx src/crawlers/index.ts",
    "crawler:build": "tsc src/crawlers/index.ts --outDir dist",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:diff": "supabase db diff",
    "typecheck": "tsc --noEmit"
  }
}
```

### Git Hooks
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test
```

### GitHub CLI Commands
```bash
# Criar issue
gh issue create --title "Bug: Crawler login failing" --body "Detailed description..."

# Criar PR
gh pr create --title "Feature: Add AI insights" --body "Changes description..."

# Verificar CI
gh run list --repo forgedeals/ldm-bot
```

---

## 📚 Recursos e Referências

### Documentação
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Playwright Docs](https://playwright.dev/)
- [Vite Docs](https://vitejs.dev/)

### Ferramentas
- [VS Code Extensions](https://marketplace.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Postman](https://www.postman.com/)

### Comunidades
- [React Discord](https://discord.gg/react)
- [TypeScript Community](https://github.com/microsoft/TypeScript/discussions)
- [Supabase Discord](https://discord.gg/supabase)

---

## 🤝 Contribuição

### Pull Request Process
1. Fork do repositório
2. Branch feature/nome-da-feature
3. Desenvolvimento com testes
4. Commit com mensagens claras
5. Push e criar PR
6. Code review
7. Merge

### Code Review Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes incluídos e passando
- [ ] Documentação atualizada
- [ ] Performance considerada
- [ ] Security review
- [ ] Accessibility check

### Release Process
1. Atualizar versão no package.json
2. Atualizar CHANGELOG.md
3. Criar git tag
4. Deploy automático via CI/CD
5. Verificar em produção

---

*Documentação atualizada: Maio 2026*
