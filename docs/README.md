# ForgeDeals AI Bot - Documentação Completa

## 🚀 Visão Geral

O **ForgeDeals AI Bot** é um sistema automatizado para monitoramento, análise e divulgação de ofertas de produtos com foco em ferramentas e equipamentos. O projeto combina web scraping, IA generativa e automação para criar um fluxo completo de captura e publicação de ofertas.

### 🎯 Objetivos Principais

- **Monitoramento Contínuo**: Rastreamento automático de ofertas em múltiplas fontes
- **Análise Inteligente**: Processamento com IA para identificar melhores oportunidades
- **Publicação Automática**: Divulgação em redes sociais e canais de afiliados
- **Dashboard Analítico**: Interface completa para gestão e métricas

---

## 🏗️ Arquitetura do Sistema

### Frontend
- **React 19** com TypeScript
- **Vite** como bundler e servidor de desenvolvimento
- **TailwindCSS** para estilização com design dark/premium
- **React Router** para navegação SPA
- **Recharts** para visualizações de dados
- **Motion (Framer Motion)** para animações

### Backend
- **Node.js + Express** servidor API
- **Supabase** como banco de dados PostgreSQL
- **Google Gemini AI** para análise de produtos
- **Playwright** para web scraping

### Infraestrutura
- **n8n** para automações e workflows
- **Webhooks** para integração externa
- **RLS (Row Level Security)** no Supabase

---

## 📊 Estrutura de Dados

### Entidades Principais

#### Products
```typescript
interface Product {
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
  ai_score?: number; // 0-100
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

#### Crawler Logs
```typescript
interface CrawlerLog {
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

#### Posts de Redes Sociais
```typescript
interface Post {
  id: string;
  product_id: string;
  platform: 'telegram' | 'whatsapp' | 'instagram' | 'facebook';
  status: 'pending' | 'published' | 'failed';
  created_at: string;
}
```

---

## 🔧 Configuração e Setup

### Pré-requisitos
- Node.js 18+
- Conta Supabase
- API Key Google Gemini
- n8n (opcional, para automações)

### Instalação
```bash
# 1. Clonar repositório
git clone <repository-url>
cd ldm_bot

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local

# 4. Setup do banco de dados
# Execute o script supabase_setup.sql no Editor SQL do Supabase

# 5. Iniciar desenvolvimento
npm run dev
```

### Variáveis de Ambiente
```bash
# GEMINI_API_KEY: Required para Gemini AI API calls
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: URL onde o app está hospedado
APP_URL="MY_APP_URL"

# SUPABASE_URL: URL do projeto Supabase
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# SUPABASE_ANON_KEY: Chave anônima do Supabase
VITE_SUPABASE_ANON_KEY="your-anon-key"

# N8N_WEBHOOK_URL: Webhook para publicação/automação
VITE_N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/..."
```

---

## 🕷️ Implementação de Crawlers

### Loja do Mecânico

#### Fluxo de Autenticação
```javascript
// Processo de login 2-step
await page.goto('https://www.lojadomecanico.com.br/login');
await page.fill('[placeholder*="E-mail"]', process.env.LOJA_DO_MECANICO_EMAIL);
await page.click('button:has-text("Continuar")');
await page.fill('[placeholder*="Senha"]', process.env.LOJA_DO_MECANICO_PASSWORD);
await page.click('button:has-text("Continuar")');
```

#### Extração de Dados
```javascript
const productData = {
  title: document.querySelector('h1')?.textContent?.trim(),
  price: document.querySelector('[class*="price"]')?.textContent?.trim(),
  image: document.querySelector('img[alt*="Imagem"]')?.src,
  brand: document.querySelector('.brand')?.textContent?.trim(),
  category: document.querySelector('.breadcrumb a:last-child')?.textContent?.trim(),
  affiliateLinks: []
};

// Extração de links de afiliado
document.querySelectorAll('.generate-link').forEach(link => {
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
```

#### Estrutura de Links
- **Facebook**: `https://www.facebook.com/sharer/sharer.php?u={URL}`
- **Whatsapp**: `https://api.whatsapp.com/send?text={URL}`
- **Telegram**: `https://t.me/share/url?url={URL}`

---

## 🚀 API Endpoints

### Público
- `POST /api/public/ingest` - Ingestão de produtos via n8n

### Estrutura da Requisição
```json
{
  "title": "Nome do Produto",
  "price": 299.90,
  "old_price": 399.90,
  "discount": 25,
  "image": "https://example.com/image.jpg",
  "category": "Ferramentas Elétricas",
  "brand": "Marca",
  "affiliate_url": "https://example.com/aff/123",
  "original_url": "https://loja.com/produto/123"
}
```

### Serviços Disponíveis
- **productService**: Gestão de produtos
- **crawlerService**: Controle de crawlers
- **aiService**: Processamento com IA
- **publishService**: Publicação em redes sociais

---

## 🎨 Interface do Usuário

### Dashboard Principal
- Estatísticas em tempo real
- Gráficos de ofertas e valores
- Top categorias e marcas
- Produtos recentes

### Módulos Disponíveis
1. **Dashboard** - Visão geral e métricas
2. **Produtos** - Gestão completa do catálogo
3. **Automação** - Configuração de workflows
4. **Crawler Engine** - Controle de scraping
5. **Playwright Worker** - Workers especializados
6. **Affiliate Engine** - Processamento de links

### Design System
- **Tema**: Dark mode premium
- **Cores**: Gradientes com laranja/azul
- **Componentes**: Cards com glassmorphism
- **Animações**: Motion (Framer Motion)

---

## 🤖 Integração com IA

### Google Gemini AI
- **Análise de Produtos**: Geração de descrições e scores
- **Otimização de Texto**: Copy para redes sociais
- **Classificação**: Categorização automática

### Exemplo de Uso
```typescript
// Análise de produto com IA
const analysis = await gemini.analyzeProduct({
  title: product.title,
  description: product.description,
  price: product.price,
  category: product.category
});

// Resultado
{
  ai_description: "Ferramenta profissional de alta performance...",
  ai_score: 92,
  ai_analysis: "Excelente oportunidade com 25% de desconto...",
  telegram_copy: "🔥 OFERTA IMPERDÍVEL! 🛠️\n\n[Produto] por apenas R$299,90\n\n✅ Frete grátis\n⚡ Parcelamento em até 12x\n\n🔗 Link: [URL]"
}
```

---

## 📱 Automação e Publicação

### n8n Integration
- **Webhooks**: Recebimento automático de ofertas
- **Workflows**: Processamento e publicação
- **Scheduling**: Execução periódica de crawlers

### Canais de Publicação
- **Telegram**: Posts formatados com emojis
- **WhatsApp**: Mensagens com links de afiliado
- **Facebook**: Compartilhamento automático
- **Instagram**: Stories e posts

### Formatação de Conteúdo
```typescript
// Template para Telegram
const telegramTemplate = `
🔥 {emoji} OFERTA IMPERDÍVEL! {emoji}

🛠️ {title}
💰 De: {old_price} por apenas {price}
🏷️ {discount}% de desconto

✅ {highlights}
⚡ Parcelamento em até {installments}

🔗 Compre agora: {affiliate_url}
`;
```

---

## 📊 Monitoramento e Métricas

### KPIs Disponíveis
- **Total de Produtos**: Catálogo completo
- **Ofertas Ativas**: Produtos em promoção
- **Publicações Hoje**: Conteúdo gerado no dia
- **CTR**: Click-through rate dos links
- **Conversões**: Vendas via afiliados

### Relatórios
- **Diário**: Performance diária
- **Semanal**: Tendências e comparações
- **Mensal**: Resumo completo e estratégias

### Alertas
- **Novas Ofertas**: Notificações em tempo real
- **Erros de Crawler**: Falhas no scraping
- **Métricas Críticas**: Desempenho abaixo do esperado

---

## 🔒 Segurança

### Implementações
- **RLS**: Row Level Security no Supabase
- **API Keys**: Variáveis de ambiente
- **CORS**: Configuração restrita
- **Input Validation**: Validação rigorosa

### Best Practices
- **Sanitização**: Limpeza de dados de entrada
- **Rate Limiting**: Controle de requisições
- **Logging**: Registro de atividades
- **Backup**: Backup automático do banco

---

## 🚀 Deploy

### Produção
```bash
# Build do projeto
npm run build

# Start do servidor
npm start

# Variáveis de produção
NODE_ENV=production
PORT=3000
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Ambiente Cloud
- **Vercel**: Frontend React
- **Supabase**: Backend e banco
- **n8n Cloud**: Automações
- **Railway/Render**: API server

---

## 🛠️ Desenvolvimento

### Estrutura de Arquivos
```
src/
├── components/          # Componentes UI
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── ProductList.tsx
│   └── Automation.tsx
├── services/           # Serviços de API
│   └── productService.ts
├── lib/               # Utilitários
│   ├── supabase.ts
│   └── utils.ts
├── types.ts           # Tipos TypeScript
└── App.tsx           # Componente principal
```

### Scripts Úteis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting do código
npm run clean        # Limpeza do dist/
```

### Contribuição
1. Fork do repositório
2. Branch feature/nome-da-feature
3. Commit com mensagens claras
4. Pull request detalhado

---

## 📞 Suporte

### Documentação Adicional
- **API Reference**: Detalhes dos endpoints
- **Database Schema**: Estrutura completa
- **Troubleshooting**: Problemas comuns

### Contato
- **Issues**: GitHub issues
- **Email**: support@forgedeals.com
- **Discord**: Comunidade de desenvolvedores

---

## 📝 Licença

MIT License - Copyright © 2026 ForgeDeals AI Bot

---

*Última atualização: Maio 2026*
