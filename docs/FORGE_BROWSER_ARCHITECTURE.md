# Arquitetura Forge Browser - Documentação

## Visão Geral

A arquitetura Forge Browser resolve problemas de instabilidade do Chrome com CDP (Chrome DevTools Protocol) usando um **profile isolado** ao invés do profile pessoal do usuário.

## Problema Resolvido

### Antes (Problemático)
```
Chrome pessoal + Profile 1 real + CDP = Conflitos
```
Problemas:
- Chrome bloqueia `--remote-debugging-port` em profiles ativos
- Conflito entre instâncias do Chrome
- Corrupção de profile
- Perda de sessão pessoal
- Fechamento inesperado

### Depois (Estável)
```
Chrome ForgeDeals + Profile Clonado + CDP = Estável
```
Soluções:
- Profile totalmente isolado em `C:\forge-browser\`
- Sessão do Facebook mantida (cookies copiados)
- Sem conflito com Chrome pessoal
- Reconexão automática
- Health monitoring

## Estrutura de Diretórios

```
C:\forge-browser\
├── chrome-profile\          # Profile Chrome isolado
├── sessions\                # Sessões salvas
├── screenshots\              # Screenshots automáticos
├── traces\                   # Traces de debug
├── logs\                    # Logs de operações
├── downloads\               # Downloads do browser
└── config.json             # Configuração
```

## Fluxo de Setup

### 1. Setup Inicial (Executar uma vez)
```bash
npm run chrome:setup
```
Ou diretamente:
```bash
scripts\setup-forge-browser.bat
```

Isso:
- Cria estrutura de diretórios
- Clona Profile 1 → `C:\forge-browser\chrome-profile`
- Configura ambiente

### 2. Iniciar Browser
```bash
npm run chrome:start
```
Ou:
```bash
scripts\start-forge-browser.bat
```

Isso:
- Inicia Chrome com CDP na porta 9222
- Usa profile isolado
- Abre Facebook automaticamente
- Mantém sessão logada

### 3. Testar Conexão
```bash
npm run chrome:test
```

Verifica:
- CDP disponível
- Conexão Playwright
- Sessão Facebook
- Screenshots
- Health check

## Arquitetura de Código

### NÃO Use (Antigo)
```typescript
// ❌ NÃO - Launch cria nova instância
const browser = await chromium.launch({
  headless: false
});

// ❌ NÃO - Launch persistent context é instável
const context = await chromium.launchPersistentContext(
  'C:\\Users\\...\\Profile 1'
);
```

### USE (Novo)
```typescript
// ✅ SIM - Conectar em CDP existente
import { forgeBrowser } from './modules/browser';

// Conectar
const { browser, context, page } = await forgeBrowser.connect();

// Usar normalmente
await page.goto('https://facebook.com');

// Tirar screenshot
await forgeBrowser.takeScreenshot('exemplo');

// Validar sessão
const session = await forgeBrowser.validateFacebookSession();
console.log(`Logado: ${session.isLoggedIn}`);
```

## API do ForgeBrowserManager

### Conexão
```typescript
// Verificar se CDP disponível
const available = await forgeBrowser.isCDPAvailable();

// Conectar
const { browser, context, page } = await forgeBrowser.connect();

// Desconectar (Chrome continua rodando)
await forgeBrowser.disconnect();

// Reconectar
await forgeBrowser.reconnect();
```

### Health Check
```typescript
// Check manual
const health = await forgeBrowser.checkHealth();
console.log(health.isHealthy);
console.log(health.memoryUsage); // MB
console.log(health.uptime); // segundos

// Aguardar saudável
await forgeBrowser.waitForHealthy(30000);
```

### Screenshots e Logs
```typescript
// Screenshot
const path = await forgeBrowser.takeScreenshot('nome');

// Log
const path = forgeBrowser.saveLog('evento', dados);
```

### Gerenciamento de Abas
```typescript
// Fechar abas extras
const closed = await forgeBrowser.closeExtraTabs();

// Abrir nova aba
const newPage = await forgeBrowser.openNewTab('https://...');

// Listar páginas
const pages = await forgeBrowser.getPages();
```

## Hook React: useForgeBrowser

```typescript
import { useForgeBrowser } from '../hooks/useForgeBrowser';

function MeuComponente() {
  const { 
    isConnected, 
    isHealthy, 
    isConnecting,
    health,
    error,
    actions 
  } = useForgeBrowser();

  // Ações
  const handleConnect = () => actions.connect();
  const handleReconnect = () => actions.reconnect();
  
  return (
    <div>
      <p>Status: {isConnected ? '🟢' : '🔴'}</p>
      <p>Saúde: {isHealthy ? '✅' : '⚠️'}</p>
      <button onClick={handleConnect} disabled={isConnecting}>
        Conectar
      </button>
    </div>
  );
}
```

## Worker: ForgeWorker

```typescript
import { ForgeWorker, Job } from './modules/browser';

const worker = new ForgeWorker();
await worker.initialize();

// Criar job
const job: Job = {
  id: 'job-123',
  type: 'scrape',
  platform: 'facebook',
  url: 'https://facebook.com/groups/...',
  priority: 'high',
  maxRetries: 3,
  timeoutMs: 60000
};

// Executar
const result = await worker.executeJob(job);
console.log(result.success);
console.log(result.duration);
console.log(result.screenshots);
```

## Comandos NPM

| Comando | Descrição |
|---------|-----------|
| `npm run chrome:setup` | Setup completo inicial |
| `npm run chrome:clone` | Re-clonar Profile 1 |
| `npm run chrome:start` | Iniciar Chrome CDP |
| `npm run chrome:test` | Testar conexão CDP |
| `npm run chrome:legacy` | Script antigo (deprecado) |

## Troubleshooting

### CDP não disponível
```bash
# Verificar se Chrome rodando
curl http://localhost:9222/json/version

# Se não responder, iniciar:
npm run chrome:start
```

### Profile corrompido
```bash
# Re-clonar profile
npm run chrome:clone
npm run chrome:start
```

### Sessão expirada
```bash
# Abrir Chrome normal
# Fazer login no Facebook
# Fechar Chrome
npm run chrome:clone  # Copiar sessão nova
npm run chrome:start
```

### Porta 9222 em uso
```bash
# Verificar processo
netstat -ano | findstr 9222

# Matar Chrome se necessário
taskkill /F /IM chrome.exe
```

## Segurança

- Profile isolado não afeta Chrome pessoal
- Cookies do Facebook copiados, não compartilhados
- Chrome pessoal pode rodar simultaneamente
- Sem risco de perder sessão pessoal

## Arquitetura do Sistema

```
┌─────────────────────────────────────┐
│         Aplicação React              │
│     (useForgeBrowser hook)          │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      ForgeBrowserManager            │
│   (Singleton, EventEmitter)         │
│                                     │
│  - Conectar CDP                     │
│  - Health Check                     │
│  - Screenshots                      │
│  - Reconexão Automática             │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      FacebookSessionValidator       │
│                                     │
│  - Validar login                    │
│  - Verificar grupos                 │
│  - Detectar bloqueios               │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│    Chrome CDP (localhost:9222)       │
│                                     │
│  Profile: C:\forge-browser\          │
│  chrome-profile                     │
│  (Clone isolado do Profile 1)       │
└─────────────────────────────────────┘
```

## Próximos Passos

1. Executar setup: `npm run chrome:setup`
2. Testar conexão: `npm run chrome:test`
3. Iniciar workers: `npm run dev:workers`
4. Abrir dashboard: `npm run dev:web`
