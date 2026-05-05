# Guia de Deploy - ForgeDeals AI Bot

## 🚀 Visão Geral

Guia completo para deploy do ForgeDeals AI Bot em ambiente de produção, incluindo configuração de infraestrutura, CI/CD e monitoramento.

---

## 🏗️ Arquitetura de Produção

### Componentes
- **Frontend**: React/Vite (Vercel/Netlify)
- **Backend API**: Node.js/Express (Railway/Render)
- **Banco de Dados**: Supabase (managed)
- **Automações**: n8n Cloud
- **Crawlers**: Docker containers (Railway/Render)
- **Monitoramento**: Uptime Robot + Custom dashboard

### Fluxo de Deploy
```
GitHub → CI/CD → Build → Deploy → Monitor
```

---

## 🔧 Configuração de Ambiente

### Variáveis de Produção
```bash
# Aplicação
NODE_ENV=production
PORT=3000
APP_URL=https://forgedeals.vercel.app

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# n8n Webhooks
VITE_N8N_WEBHOOK_URL=https://your-n8n.app.webhook.com

# Crawler Configuration
CRAWLER_HEADLESS=true
CRAWLER_TIMEOUT=30000
CRAWLER_RATE_LIMIT=2000

# Credentials (usar secrets do deploy)
LOJA_DO_MECANICO_EMAIL=${LOJA_DO_MECANICO_EMAIL}
LOJA_DO_MECANICO_PASSWORD=${LOJA_DO_MECANICO_PASSWORD}

# Monitoramento
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

---

## 📱 Frontend Deploy (Vercel)

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-api.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_N8N_WEBHOOK_URL": "@n8n_webhook_url"
  },
  "build": {
    "env": {
      "VITE_SUPABASE_URL": "@supabase_url",
      "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
    }
  }
}
```

### Deploy Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Setup environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add N8N_WEBHOOK_URL
```

### Custom Domain
```bash
# Adicionar domínio customizado
vercel domains add forgedeals.com

# Configurar DNS
# A -> 76.76.21.21
# CNAME -> cname.vercel-dns.com
```

---

## 🖥️ Backend API Deploy (Railway)

### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Dockerfile
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

# Copiar arquivos de configuração primeiro
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do TypeScript
RUN npm run build

# Criar diretório de logs
RUN mkdir -p logs screenshots

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD ["npm", "start"]
```

### package.json Scripts
```json
{
  "scripts": {
    "start": "node dist/server.cjs",
    "build": "vite build",
    "dev": "tsx server.ts",
    "lint": "tsc --noEmit",
    "test": "jest",
    "crawler:dev": "tsx src/crawlers/index.ts",
    "crawler:prod": "node dist/crawlers/index.js"
  }
}
```

---

## 🗄️ Banco de Dados (Supabase)

### Setup Production
```bash
# 1. Criar novo projeto Supabase
# 2. Executar script de setup
supabase db push

# 3. Configurar RLS policies
supabase db diff --use-migra

# 4. Habilitar Realtime
supabase realtime enable
```

### Migrations
```sql
-- 001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  discount NUMERIC,
  category TEXT,
  brand TEXT,
  affiliate_url TEXT NOT NULL,
  original_url TEXT,
  ai_description TEXT,
  ai_score NUMERIC DEFAULT 0,
  ai_analysis TEXT,
  telegram_copy TEXT,
  active BOOLEAN DEFAULT TRUE,
  is_hot BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');

-- Functions
CREATE OR REPLACE FUNCTION increment_views(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

---

## 🤖 Automações (n8n Cloud)

### Workflow Configuration
```json
{
  "name": "Product Ingestion",
  "active": true,
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "ingest",
        "options": {}
      }
    },
    {
      "name": "Validate Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Validate required fields\nconst { title, price, affiliate_url } = $input.first().json;\n\nif (!title || !price || !affiliate_url) {\n  throw new Error('Missing required fields');\n}\n\nreturn $input.first().json;"
      }
    },
    {
      "name": "Send to API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-api.railway.app/api/public/ingest",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "title": "={{ $json.title }}",
          "price": "={{ $json.price }}",
          "affiliate_url": "={{ $json.affiliate_url }}"
        }
      }
    }
  ]
}
```

### Environment Setup
```bash
# n8n Cloud credentials
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password

# External service credentials
WEBHOOK_URL=https://your-n8n.app.webhook.com
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### .github/workflows/deploy.yml
```yaml
name: Deploy ForgeDeals AI Bot

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
          service: forgedeals-api

  run-crawler:
    needs: deploy-backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          LOJA_DO_MECANICO_EMAIL: ${{ secrets.LOJA_DO_MECANICO_EMAIL }}
          LOJA_DO_MECANICO_PASSWORD: ${{ secrets.LOJA_DO_MECANICO_PASSWORD }}
        run: npm run crawler:prod
```

### Secrets Configuration
```bash
# GitHub Secrets
VERCEL_TOKEN=your-vercel-token
ORG_ID=your-vercel-org-id
PROJECT_ID=your-vercel-project-id
RAILWAY_TOKEN=your-railway-token
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
GEMINI_API_KEY=your-gemini-api-key
LOJA_DO_MECANICO_EMAIL=your-email
LOJA_DO_MECANICO_PASSWORD=your-password
```

---

## 📊 Monitoramento e Logging

### Sentry Integration
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
app.use(Sentry.Handlers.requestHandler());
```

### Custom Health Check
```typescript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      ai_service: 'unknown',
      supabase: 'unknown'
    },
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    // Check database
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    health.services.database = error ? 'error' : 'connected';
    health.services.supabase = error ? 'error' : 'connected';
    
    // Check AI service
    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY }
    });
    
    health.services.ai_service = aiResponse.ok ? 'available' : 'error';
    
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
  }
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Uptime Monitoring
```yaml
# Uptime Robot configuration
monitors:
  - name: ForgeDeals API
    url: https://your-api.railway.app/api/health
    interval: 300
    alert_contacts:
      - email: admin@forgedeals.com
      - slack: #webhook-url
  
  - name: ForgeDeals Frontend
    url: https://forgedeals.vercel.app
    interval: 300
    alert_contacts:
      - email: admin@forgedeals.com
```

---

## 🔒 Segurança em Produção

### SSL/TLS Configuration
```nginx
# Nginx reverse proxy (se necessário)
server {
    listen 443 ssl http2;
    server_name forgedeals.com;
    
    ssl_certificate /etc/ssl/certs/forgedeals.crt;
    ssl_certificate_key /etc/ssl/private/forgedeals.key;
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass https://forgedeals.vercel.app;
    }
}
```

### Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

---

## 📈 Performance e Otimização

### Caching Strategy
```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // 10 minutes
});

// Cache middleware
const cacheMiddleware = (duration: number) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};

// Usage
app.get('/api/products', cacheMiddleware(300), async (req, res) => {
  const products = await productService.getProducts();
  res.json(products);
});
```

### Database Optimization
```sql
-- Indexes para performance
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_ai_score ON products(ai_score DESC) WHERE ai_score > 80;

-- Partitioning para logs (se necessário)
CREATE TABLE crawler_logs_2026_05 PARTITION OF crawler_logs
FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

---

## 🔄 Backup e Recovery

### Automated Backups
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/forgedeals"

# Supabase backup
supabase db dump --data-only --file="$BACKUP_DIR/supabase_$DATE.sql"

# Comprimir backup
gzip "$BACKUP_DIR/supabase_$DATE.sql"

# Upload para S3 (opcional)
aws s3 cp "$BACKUP_DIR/supabase_$DATE.sql.gz" \
  s3://forgedeals-backups/database/

# Limpar backups antigos (30 dias)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Recovery Process
```bash
# 1. Parar aplicação
pm2 stop forgedeals-api

# 2. Restore database
supabase db reset --file=backup.sql

# 3. Run migrations
supabase db push

# 4. Restart application
pm2 start forgedeals-api

# 5. Verify health
curl -f https://your-api.railway.app/api/health
```

---

## 📱 Deploy Checklist

### Pre-deploy
- [ ] Atualizar versão no package.json
- [ ] Rodar testes completos
- [ ] Verificar variáveis de ambiente
- [ ] Backup do banco atual
- [ ] Documentar mudanças

### Deploy
- [ ] Merge para main branch
- [ ] Aguardar CI/CD completion
- [ ] Verificar health endpoints
- [ ] Testar funcionalidades críticas
- [ ] Monitorar logs iniciais

### Post-deploy
- [ ] Verificar monitoramento
- [ ] Testar crawlers
- [ ] Validar integrações
- [ ] Comunicar equipe
- [ ] Documentar issues

---

## 🚀 Escalabilidade

### Horizontal Scaling
```yaml
# docker-compose.yml (para múltiplas instâncias)
version: '3.8'
services:
  api:
    image: forgedeals/api:latest
    replicas: 3
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Database Scaling
```sql
-- Read replica configuration (se necessário)
CREATE USER replica_user WITH REPLICATION ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE forgedeals TO replica_user;
GRANT USAGE ON SCHEMA public TO replica_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replica_user;
```

---

## 📞 Suporte e Manutenção

### On-call Rotation
- **Primary**: Engenheiro DevOps
- **Secondary**: Backend Developer
- **Escalation**: Tech Lead

### Incident Response
1. **Detection**: Monitoramento automático
2. **Assessment**: Impacto evaluation
3. **Response**: Mitigação imediata
4. **Recovery**: Restauração completa
5. **Post-mortem**: Análise e melhorias

### Maintenance Schedule
- **Daily**: Health checks, log review
- **Weekly**: Performance analysis, backup verification
- **Monthly**: Security updates, dependency updates
- **Quarterly**: Architecture review, capacity planning

---

*Documentação atualizada: Maio 2026*
