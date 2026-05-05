# API Reference - ForgeDeals AI Bot

## 🚀 Visão Geral

API RESTful para gestão de produtos, automação e análise de ofertas do ForgeDeals AI Bot.

### Base URL
- **Desenvolvimento**: `http://localhost:3000`
- **Produção**: `https://your-domain.com`

### Autenticação
A API utiliza autenticação via Supabase com Row Level Security (RLS).

---

## 📊 Endpoints

### 🔄 Ingestão de Produtos

#### POST /api/public/ingest
Endpoint público para ingestão de produtos via webhooks (n8n).

**Headers**
```http
Content-Type: application/json
```

**Body**
```json
{
  "title": "Furadeira de Impacto 1/2 Pol. 550W GSB 550 RE",
  "price": 289.90,
  "old_price": 349.90,
  "discount": 17,
  "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c",
  "category": "Ferramentas Elétricas",
  "brand": "Bosch",
  "affiliate_url": "https://example.com/aff/1",
  "original_url": "https://lojadomecanico.com.br/1"
}
```

**Resposta (201)**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-produto",
    "title": "Furadeira de Impacto 1/2 Pol. 550W GSB 550 RE",
    "slug": "furadeira-impacto-bosch-gsb550",
    "price": 289.90,
    "old_price": 349.90,
    "discount": 17,
    "created_at": "2026-05-04T17:00:00.000Z"
  }
}
```

**Erros**
- `400` - Campos obrigatórios faltando
- `500` - Erro interno do servidor

---

## 🗃️ Serviços de Produtos

### productService

#### getProducts()
Retorna lista completa de produtos.

```typescript
const products = await productService.getProducts();
```

**Retorno**
```typescript
interface Product[] {
  id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  old_price: number;
  discount: number;
  category: string;
  brand: string;
  affiliate_url: string;
  original_url: string;
  ai_description?: string;
  ai_score?: number;
  ai_analysis?: string;
  telegram_copy?: string;
  active: boolean;
  is_hot: boolean;
  views: number;
  clicks: number;
  ctr: number;
  created_at: string;
}
```

#### getProductById(id)
Retorna produto específico com incremento de visualização.

```typescript
const product = await productService.getProductById('uuid-do-produto');
```

#### trackClick(productId)
Registra clique no produto para cálculo de CTR.

```typescript
await productService.trackClick('uuid-do-produto');
```

#### getPriceHistory(productId)
Retorna histórico de preços do produto.

```typescript
const history = await productService.getPriceHistory('uuid-do-produto');
```

**Retorno**
```typescript
interface PriceHistory[] {
  id: string;
  product_id: string;
  price: number;
  created_at: string;
}
```

#### getDashboardStats()
Retorna estatísticas para o dashboard.

```typescript
const stats = await productService.getDashboardStats();
```

**Retorno**
```typescript
interface DashboardStats {
  totalProducts: number;
  activeOffers: number;
  publishedToday: number;
  topCategories: { name: string; count: number }[];
  topBrands: { name: string; count: number }[];
}
```

---

## 🤖 Serviços de IA

### aiService

#### analyzeProduct(productData)
Analisa produto com Google Gemini AI.

```typescript
const analysis = await aiService.analyzeProduct({
  title: "Furadeira de Impacto 1/2 Pol. 550W",
  price: 289.90,
  category: "Ferramentas Elétricas",
  brand: "Bosch"
});
```

**Retorno**
```typescript
interface AIAnalysis {
  ai_description: string;
  ai_score: number; // 0-100
  ai_analysis: string;
  telegram_copy: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}
```

#### generateSocialCopy(product, platform)
Gera texto otimizado para redes sociais.

```typescript
const copy = await aiService.generateSocialCopy(product, 'telegram');
```

**Retorno**
```typescript
interface SocialCopy {
  platform: 'telegram' | 'whatsapp' | 'instagram' | 'facebook';
  title: string;
  body: string;
  hashtags: string[];
  emoji_set: string[];
}
```

---

## 🕷️ Serviços de Crawling

### crawlerService

#### runCrawler(source)
Executa crawler para fonte específica.

```typescript
const result = await crawlerService.runCrawler('lojadomecanico');
```

**Retorno**
```typescript
interface CrawlerResult {
  source: string;
  status: 'success' | 'failure';
  total_products: number;
  new_products: number;
  updated_products: number;
  ignored_products: number;
  duration_ms: number;
  error_message?: string;
  products: Product[];
}
```

#### getCrawlerLogs()
Retorna logs de execuções anteriores.

```typescript
const logs = await crawlerService.getCrawlerLogs();
```

**Retorno**
```typescript
interface CrawlerLog[] {
  id: string;
  source: string;
  status: 'success' | 'failure';
  total_products: number;
  new_products: number;
  updated_products: number;
  ignored_products: number;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}
```

#### scheduleCrawler(source, schedule)
Agenda execução periódica de crawler.

```typescript
await crawlerService.scheduleCrawler('lojadomecanico', '0 */6 * * *');
```

---

## 📱 Serviços de Publicação

### publishService

#### publishToTelegram(product)
Publica produto no Telegram.

```typescript
const result = await publishService.publishToTelegram(product);
```

**Retorno**
```typescript
interface PublishResult {
  success: boolean;
  platform: 'telegram';
  post_id: string;
  message_id?: string;
  error_message?: string;
  published_at: string;
}
```

#### publishToWhatsApp(product)
Publica produto no WhatsApp.

```typescript
const result = await publishService.publishToWhatsApp(product);
```

#### publishToAllPlatforms(product)
Publica em todas as plataformas configuradas.

```typescript
const results = await publishService.publishToAllPlatforms(product);
```

---

## 🔧 Configuração e Setup

### Variáveis de Ambiente

```bash
# Configuração Supabase
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Webhooks n8n
VITE_N8N_WEBHOOK_URL="https://your-n8n.com/webhook"

# Configurações da Aplicação
APP_URL="https://your-app.com"
NODE_ENV="development"
PORT=3000
```

### Configuração do Supabase

Execute o script `supabase_setup.sql` no Editor SQL:

```sql
-- Criar tabelas
CREATE TABLE products (...);
CREATE TABLE price_history (...);
CREATE TABLE posts (...);
CREATE TABLE crawler_logs (...);

-- Configurar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON products FOR SELECT USING (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

---

## 📊 Estrutura do Banco de Dados

### Tabela: products
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| title | TEXT | Nome do produto |
| slug | TEXT | URL amigável (único) |
| image | TEXT | URL da imagem |
| price | NUMERIC | Preço atual |
| old_price | NUMERIC | Preço anterior |
| discount | NUMERIC | Percentual de desconto |
| category | TEXT | Categoria do produto |
| brand | TEXT | Marca do produto |
| affiliate_url | TEXT | Link de afiliado |
| original_url | TEXT | URL original |
| ai_description | TEXT | Descrição gerada por IA |
| ai_score | NUMERIC | Score de qualidade (0-100) |
| ai_analysis | TEXT | Análise detalhada |
| telegram_copy | TEXT | Texto para Telegram |
| active | BOOLEAN | Status ativo |
| is_hot | BOOLEAN | Oferta quente |
| views | INTEGER | Visualizações |
| clicks | INTEGER | Cliques |
| ctr | NUMERIC | Click-through rate |
| created_at | TIMESTAMP | Data de criação |

### Tabela: price_history
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| product_id | UUID | FK para products |
| price | NUMERIC | Preço no momento |
| created_at | TIMESTAMP | Data do registro |

### Tabela: posts
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| product_id | UUID | FK para products |
| platform | TEXT | Plataforma de publicação |
| status | TEXT | Status do post |
| published_at | TIMESTAMP | Data de publicação |
| created_at | TIMESTAMP | Data de criação |

---

## 🔌 Webhooks e Integrações

### n8n Webhook

**Endpoint**: `POST /api/public/ingest`

**Payload Esperado**:
```json
{
  "source": "lojadomecanico",
  "products": [
    {
      "title": "Produto Exemplo",
      "price": 299.90,
      "old_price": 399.90,
      "discount": 25,
      "image": "https://example.com/image.jpg",
      "category": "Ferramentas",
      "brand": "Marca",
      "affiliate_url": "https://example.com/aff/123",
      "original_url": "https://store.com/product/123"
    }
  ]
}
```

### Respostas de Webhook

**Sucesso (200)**:
```json
{
  "success": true,
  "processed": 1,
  "created": 1,
  "updated": 0,
  "errors": []
}
```

**Erro (400)**:
```json
{
  "success": false,
  "error": "Missing required field: title",
  "field": "title"
}
```

---

## 📈 Métricas e Monitoramento

### KPIs da API

- **Request Rate**: Requisições por segundo
- **Response Time**: Tempo médio de resposta
- **Error Rate**: Taxa de erros
- **Active Products**: Produtos ativos no sistema
- **Daily Ingestion**: Produtos ingeridos por dia

### Health Check

**Endpoint**: `GET /api/health`

**Resposta**:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-04T17:00:00.000Z",
  "services": {
    "database": "connected",
    "ai_service": "available",
    "supabase": "connected"
  },
  "version": "1.0.0"
}
```

---

## 🛠️ Debug e Troubleshooting

### Logs da Aplicação

```bash
# Ver logs em tempo real
npm run dev

# Logs específicos
DEBUG=forge* npm run dev

# Logs de produção
pm2 logs forgedeals
```

### Problemas Comuns

#### 1. Conexão Supabase
```bash
# Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Testar conexão
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
     "$VITE_SUPABASE_URL/rest/v1/products?select=count"
```

#### 2. API Gemini
```bash
# Testar API key
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
```

#### 3. Webhook n8n
```bash
# Testar webhook
curl -X POST http://localhost:3000/api/public/ingest \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","price":99.90,"affiliate_url":"https://test.com"}'
```

---

## 📚 Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Importar serviços
import { productService, aiService, crawlerService } from './services';

// Buscar produtos
const products = await productService.getProducts();

// Analisar produto com IA
const analysis = await aiService.analyzeProduct(products[0]);

// Executar crawler
const crawlerResult = await crawlerService.runCrawler('lojadomecanico');

// Publicar no Telegram
const publishResult = await publishService.publishToTelegram(products[0]);
```

### Python (Requests)

```python
import requests

# Ingerir produto
response = requests.post('http://localhost:3000/api/public/ingest', json={
    'title': 'Produto Teste',
    'price': 199.90,
    'affiliate_url': 'https://example.com/aff/123'
})

print(response.json())
```

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Ingestão
curl -X POST http://localhost:3000/api/public/ingest \
     -H "Content-Type: application/json" \
     -d '{"title":"Furadeira","price":299.90,"affiliate_url":"https://example.com"}'
```

---

## 🚀 Deploy e Produção

### Environment Setup

```bash
# Produção
NODE_ENV=production
PORT=3000

# Build
npm run build

# Start
npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx (Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

*Documentação atualizada: Maio 2026*
