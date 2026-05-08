# PROJECT STATE FREEZE

**Data do Congelamento**: 2026-05-08  
**Versão**: Estado Atual Real  
**Propósito**: Fotografia técnica exata do projeto funcionando

---

## 1. ESTRUTURA REAL DO PROJETO

### ATIVO

**Root Level:**
- `package.json` - Workspace monorepo configurado
- `start-chrome-CDP.js` - Script de inicialização Chrome CDP principal
- `tsconfig.base.json` - Configuração TypeScript base
- `vite.config.ts` - Configuração Vite principal
- `.env.example` - Template variáveis ambiente

**apps/workers (CORE OPERACIONAL):**
- `src/index.ts` - Entry point workers
- `src/crawlers/LojaDoMecanicoCrawler.ts` - Crawler principal Loja do Mecânico
- `src/browser/chromeConnector.ts` - Conexão CDP Chrome
- `src/browser/sessionMonitor.ts` - Monitor de sessões Facebook/LojaMecanico
- `src/browser/tabsManager.ts` - Gestão de abas
- `src/browser/portDetector.ts` - Detecção portas CDP
- `src/browser/browserConfig.ts` - Configurações browser
- `src/services/affiliateLinkService.ts` - Serviço links afiliado
- `src/social-ai/facebook/facebook.publisher.ts` - Publisher Facebook (STUB)
- `src/social-ai/ollama/ollama.service.ts` - Serviço Ollama (não usado)
- `src/social-ai/scheduler/intelligent.scheduler.ts` - Scheduler (não usado)
- `src/antiSpam/humanBehavior.ts` - Comportamento humano
- `src/queues/worker.ts` - Processador filas BullMQ
- `src/config/env.ts` - Carregamento ambiente
- `package.json` - Dependências workers

**packages/shared:**
- `src/types.ts` - Tipos compartilhados
- `src/logger.ts` - Logger compartilhado
- `src/queues.ts` - Configurações filas
- `src/jobs.ts` - Tipos jobs

**tests:**
- `run-tests.ts` - Runner testes funcionais
- `test-cdp-connection.ts` - Teste conexão CDP

**scripts:**
- `setup-and-start.js` - Setup e start Chrome automatizado
- `open-pages.js` - Abertura páginas

### LEGACY

**src/ (antigo):**
- `App.tsx`, `main.tsx`, `index.css` - Frontend antigo
- `components/` - Componentes React antigos
- `config/`, `hooks/`, `lib/` - Configurações antigas
- `types.ts` - Tipos antigos

**legacy/ (apps/workers/src/legacy/):**
- `ai-orchestrator.ts` - Orquestrador IA antigo
- `browser.ts` - Browser antigo
- `crawlers.ts` - Crawlers antigos
- `social-ai.ts` - Social IA antigo
- `social.ts` - Social antigo

### EXPERIMENTAL

**apps/api:**
- `src/server.ts` - API Fastify (não usada)
- `src/routes/` - Rotas API (não usadas)

**apps/web:**
- `src/` - Frontend React (não usado)
- `vite.config.ts` - Config Vite web

**infrastructure/docker:**
- `docker-compose.yml` - Docker (não usado)
- `docker-compose.full.yml` - Docker completo (não usado)

### DESCONHECIDO

**user-data-dir/:**
- Profile Chrome clonado
- Dados temporários browser

**knowledge-preservation/:**
- `historical/` - Documentos históricos
- `reusable/` - Documentos reutilizáveis

---

## 2. FLUXO OPERACIONAL REAL

### ENTRYPOINT REAL

**Chrome CDP Start:**
```
npm run chrome:legacy
OU
node start-chrome-CDP.js
```

**Script Funciona:**
1. Mata processos Chrome existentes
2. Verifica Profile 1 em `%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Profile 1`
3. Inicia Chrome com `--remote-debugging-port=9222`
4. Abre `https://www.facebook.com`
5. Aguarda CDP responder (max 15 tentativas)
6. Verifica aba Facebook aberta

### CRAWLER LOJA DO MECÂNICO

**Ativação:**
```
cd apps/workers
RUN_LDM_CRAWLER=true npm --workspace apps/workers run dev
```

**Fluxo Real:**
1. `apps/workers/src/index.ts` → `runLojaDoMecanicoCrawler()`
2. `LojaDoMecanicoCrawler.initialize()`:
   - Conecta CDP via `ChromeConnector.getInstance()`
   - Valida sessões via `SessionMonitor.validateAllSessions()`
   - Cria aba Loja do Mecânico via `TabsManager.getOrCreateTab()`
   - Cria página via `connection.context.newPage()`
3. `LojaDoMecanicoCrawler.login()`:
   - Navega para `/login`
   - Preenche email (placeholder)
   - Preenche senha (placeholder)
   - Espera `[data-user]`
4. `LojaDoMecanicoCrawler.extractProductsFromCategory()`:
   - URL padrão: `https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas`
   - Extrai links `a[href*="/produto/"]`
   - Processa max 10 produtos
   - Rate limit: 2000ms
5. `LojaDoMecanicoCrawler.extractProductFromUrl()`:
   - Extrai: título, preço, preço antigo, imagem, marca, categoria
   - Parse preço com `parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))`
   - Gera `AffiliateLink` com dados
6. `LojaDoMecanicoCrawler.saveProducts()`:
   - Verifica existente via `affiliateLinkService.findByAffiliateUrl()`
   - Cria ou atualiza via `affiliateLinkService.createLink()`

### FACEBOOK PUBLISHER

**Estado Atual: STUB**
- `FacebookPublisher.publishPost()` retorna sucesso fake
- `postId = fb_${Date.now()}`
- Sem postagem real implementada
- Apenas conecta CDP e navega para grupo

### PERSISTÊNCIA

**Supabase:**
- `affiliateLinkService` usa `@supabase/supabase-js`
- Tabela `affiliate_links` inferida
- Registros de preço em `price_records` inferido

---

## 3. DEPENDÊNCIAS REAIS

### USADAS DE VERDADE

**Workers (Core):**
- `playwright` - Automação browser
- `@supabase/supabase-js` - Persistência
- `bullmq` - Filas (configurado mas não usado ativamente)
- `ioredis` - Redis (configurado mas não usado ativamente)
- `@forge-deals/shared` - Tipos e logger

**Shared:**
- TypeScript - Tipagem
- Logger customizado

**Scripts:**
- Node.js built-ins: `child_process`, `fs`, `path`, `os`

### INSTALADAS MAS NÃO USADAS

**Workers:**
- `@supabase/supabase-js` - Configurado mas uso limitado
- `bullmq` - Configurado mas sem jobs ativos
- `ioredis` - Configurado mas sem conexões ativas

**API (não usada):**
- `fastify` - Server framework
- `pino` - Logger
- `zod` - Validação

**Web (não usada):**
- `react` - Frontend framework
- `vite` - Build tool
- `lucide-react` - Ícones
- `recharts` - Gráficos
- `motion` - Animações

### SUSPEITAS

**Ollama Service:**
- Importado mas não chamado
- Configurado mas sem uso

**Intelligent Scheduler:**
- Importado mas não usado
- Lógica complexa sem ativação

---

## 4. PACKAGE.JSON REAL

### FUNCIONAM

**Root:**
- `chrome:legacy` - ✅ Funciona
- `chrome:setup` - ✅ Funciona  
- `chrome:start` - ✅ Funciona
- `chrome:test` - ✅ Funciona
- `test` - ✅ Funciona (test runner)
- `test:cdp` - ✅ Funciona
- `test:fb` - ✅ Funciona (placeholder)

**Workers:**
- `dev` - ✅ Funciona (com RUN_LDM_CRAWLER=true)

### QUEBRADOS

**Root:**
- `infra:up` - ❌ Docker não configurado
- `infra:down` - ❌ Docker não configurado
- `dev:web` - ❌ Web app não implementado
- `dev:api` - ❌ API não implementada
- `dev:workers` - ❌ Sem ambiente configurado
- `browser:connect` - ❌ Script não existe

**Workers:**
- `build` - ❌ TODO não implementado
- `lint` - ❌ TODO não implementado

**API/Web:**
- Todos scripts - ❌ Apps não implementados

---

## 5. FACEBOOK — ESTADO REAL

### GRUPO ATUAL

**Nome:** "A Loja Do Mecânico"  
**Status:** Configurado mas sem implementação real

### FLUXO DE POSTAGEM

**Estado Atual:**
1. `FacebookPublisher.initialize()` - ✅ Conecta CDP
2. `FacebookPublisher.publishPost()` - ❌ STUB
   - Navega para `https://www.facebook.com/groups/${groupId}`
   - `await page.waitForTimeout(2000)`
   - Retorna `postId = fb_${Date.now()}`
   - **SEM POSTAGEM REAL**

### SELECTORES

**Não implementados:**
- Botão postar
- Campo de texto
- Modal de postagem
- Anexo de imagem

### ANTI-DETECÇÃO

**Implementado:**
- `HumanBehavior` com typing simulation
- Mouse movement básico
- Random delays

**Faltando:**
- Viewport rotation
- User agent rotation
- Delays aleatórios reais

---

## 6. LOJA DO MECÂNICO — ESTADO REAL

### LOGIN

**Credenciais:** Environment variables
- `LOJA_DO_MECANICO_EMAIL`
- `LOJA_DO_MECANICO_PASSWORD`

**Fluxo:**
1. Navega para `/login`
2. Preenche email placeholder
3. Click "Continuar"
4. Preenche senha placeholder
5. Click "Continuar"
6. Espera `[data-user]`

**PROBLEMA:** Credenciais não configuradas no ambiente

### CRAWLER

**Categoria Padrão:** `maquinas-eletricas`
**Limite:** 10 produtos
**Rate Limit:** 2000ms

**Selectores Funcionando:**
- `a[href*="/produto/"]` - Links produtos
- `h1` - Título
- `[class*="price"]` - Preço
- `[class*="old"]` - Preço antigo
- `img` - Imagem
- `.brand` - Marca
- `.breadcrumb a:last-child` - Categoria

### EXTRAÇÃO

**Dados Extraídos:**
- title ✅
- price ✅
- old_price ✅
- image ✅
- brand ✅
- category ✅
- url ✅

**Processamento:**
- Parse preço: `parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))`
- Cálculo price_drop_percentage
- Cálculo opportunity_score

---

## 7. CHROME/CDP — ESTADO REAL

### PROFILE

**Path:** `%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Profile 1`
**Requisito:** Profile 1 deve existir e ter login Facebook

### PORTA

**CDP Port:** 9222
**URL:** `http://127.0.0.1:9222`

### SCRIPTS

**start-chrome-CDP.js (Principal):**
- Mata processos Chrome
- Verifica Profile 1
- Inicia com `--remote-debugging-port=9222`
- Abre Facebook
- Aguarda CDP ready

**setup-and-start.js (Alternativo):**
- Clona Profile para `C:\forge-browser`
- Setup mais robusto
- Mais flags anti-detecção

### FLAGS

**Padrão:**
```
--remote-debugging-port=9222
--user-data-dir=%USERPROFILE%\AppData\Local\Google\Chrome\User Data
--profile-directory=Profile 1
--no-first-run
--no-default-browser-check
```

**Setup Script (adicionais):**
```
--disable-blink-features=AutomationControlled
--disable-features=Translate,OptimizationHints,InterestFeedContentSuggestions
--disable-component-extensions-with-background-pages
--disable-background-networking
--disable-sync
--disable-default-apps
--disable-popup-blocking
--disable-gpu
--start-maximized
--new-window
```

---

## 8. ARQUIVOS CRÍTICOS

### CRÍTICO (Sistema para se perdido)

**Root:**
- `start-chrome-CDP.js` - Entry point Chrome CDP
- `package.json` - Workspace config

**Workers Core:**
- `src/index.ts` - Entry point workers
- `src/crawlers/LojaDoMecanicoCrawler.ts` - Crawler principal
- `src/browser/chromeConnector.ts` - Conexão CDP
- `src/browser/sessionMonitor.ts` - Validação sessões
- `src/services/affiliateLinkService.ts` - Persistência

**Shared:**
- `src/types.ts` - Tipos core

### IMPORTANTE

**Workers:**
- `src/browser/browserConfig.ts` - Configurações
- `src/browser/tabsManager.ts` - Gestão abas
- `src/browser/portDetector.ts` - Detecção portas
- `src/antiSpam/humanBehavior.ts` - Anti-detecção

**Scripts:**
- `setup-and-start.js` - Setup alternativo

### AUXILIAR

**Tests:**
- `tests/run-tests.ts` - Validação funcional

**Legacy:**
- `src/` - Frontend antigo (referência)

### LEGADO

**apps/api, apps/web** - Não usados ativamente
**infrastructure/** - Docker não utilizado

---

## 9. CONHECIMENTO OCULTO

### HACKS E WORKAROUNDS

**Chrome CDP:**
- Profile 1 hardcoded - requer login manual prévio
- Kill agressivo: `taskkill /F /IM chrome.exe /T`
- Fetch CDP version para detectar ready state

**Memory Leaks:**
- `LojaDoMecanicoCrawler.ts:44` - `this.page = await connection.context.newPage()` sem cleanup garantido
- `sessionMonitor.ts:76` - Page creation sem finally block

**Facebook Detection:**
- Delay fixo 2000ms - padrão detectável
- Viewport fixo 1920x1080
- User agent estático

**Loja do Mecânico:**
- Rate limit 2000ms hardcoded
- Parse preço específico para formato brasileiro
- Limite 10 produtos hardcoded

### TIMEOUTS IMPORTANTES

**BrowserConfig:**
- PAGE_LOAD_TIMEOUT: 30000
- ELEMENT_WAIT_TIMEOUT: 10000

**Crawler:**
- Login wait: 15000
- Product page wait: 1000

### SELECTORES FRÁGEIS

**Facebook:**
- `[data-testid="bluebarDOMInspector"]` - pode mudar
- `[data-testid="user_menu"]` - pode mudar

**Loja do Mecânico:**
- `[data-user]` - específico do site
- `[class*="price"]` - genérico mas funcional

### ORDEM OBRIGATÓRIA

1. Chrome CDP deve iniciar primeiro
2. Profile 1 deve ter login Facebook
3. Crawler depende de CDP ativo
4. Session monitor valida antes de operar

---

## 10. CONTRADIÇÕES REALIDADE vs DOCUMENTAÇÃO

### DOCUMENTAÇÃO DIZ X, CÓDIGO FAZ Y

**Escopo Operacional:**
- **Doc:** "4 publicações por dia", "pequeno operacional"
- **Real:** Sem publicação implementada, apenas crawler

**Facebook Publisher:**
- **Doc:** "Postar em 1 grupo Facebook"
- **Real:** Apenas stub, sem postagem real

**Workers:**
- **Doc:** "BullMQ workers", "filas"
- **Real:** Configurado mas sem jobs ativos

**API/Web:**
- **Doc:** Documentação completa de APIs
- **Real:** Apps não implementados

**Dependencies:**
- **Doc:** Redis, BullMQ ativos
- **Real:** Instalados mas não utilizados

**Environment:**
- **Doc:** `.env.example` completo
- **Real:** Variáveis crawler não configuradas

---

## 11. CHECKLIST DE EXECUÇÃO REAL

### COMO RODAR O PROJETO HOJE

**Pré-requisitos:**
1. Chrome instalado em `C:\Program Files\Google\Chrome\Application\chrome.exe`
2. Profile 1 criado com login Facebook feito manualmente
3. Node.js instalado

**Setup:**
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar Chrome CDP
npm run chrome:legacy
# OU
node start-chrome-CDP.js
```

**Executar Crawler:**
```bash
# 3. Configurar ambiente (criar .env)
cp .env.example .env
# Editar .env com:
# LOJA_DO_MECANICO_EMAIL=seu@email.com
# LOJA_DO_MECANICO_PASSWORD=sua_senha
# SUPABASE_URL=sua_url
# SUPABASE_ANON_KEY=sua_key

# 4. Rodar crawler
cd apps/workers
RUN_LDM_CRAWLER=true npm --workspace apps/workers run dev
```

**Testar Conexão:**
```bash
# 5. Testar CDP
npm run test:cdp
```

**O QUE FUNCIONA HOJE:**
- ✅ Chrome CDP startup
- ✅ Conexão Playwright via CDP
- ✅ Validação sessão Facebook (básica)
- ✅ Crawler Loja do Mecânico (sem credenciais)
- ✅ Extração produtos (limitada)
- ✅ Persistência Supabase (configurada)

**O QUE NÃO FUNCIONA:**
- ❌ Postagem Facebook (apenas stub)
- ❌ Crawler completo (sem credenciais)
- ❌ API/Web apps
- ❌ Docker infrastructure
- ❌ Queue processing
- ❌ Scheduler inteligente

---

## RESUMO ESTADO ATUAL

**Funcional:** Chrome CDP + Crawler básico  
**Parcial:** Session monitor, persistência  
**Não implementado:** Facebook posting, queues, API, web frontend  
**Crítico:** Memory leaks, credenciais não configuradas, Facebook publisher stub  

**Estado:** PROTOCIPO FUNCIONAL PARCIAL  
**Risco:** MÉDIO (memory leaks, dependências externas)
