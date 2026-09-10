# LDM Bot — Fase 1: Baseline de Auditoria

**Status:** CONCLUÍDA  
**Data:** 2026-09-09  
**Objetivo:** auditar o sistema existente antes de alterar sua arquitetura.

## 1. Resultado executivo

A auditoria confirma que **não é necessário criar uma nova aplicação**. O `ldm_bot` atual contém o núcleo funcional necessário, mas a estrutura possui acoplamentos e infraestrutura que aumentam a complexidade sem evidência de necessidade para o objetivo atual.

A direção recomendada é uma **refatoração cirúrgica do repositório existente**, preservando crawler, automação Facebook, Supabase e integração de IA.

### Decisão principal

**Remover Redis/BullMQ/Workers da arquitetura operacional da V1, após migrar as responsabilidades úteis para a API.**

Motivos comprovados nesta fase:

- o crawler já é executado diretamente pela API;
- `POST /api/crawler/run` aguarda `runCrawl()` e devolve o resultado na própria requisição;
- a API depende de código dentro de `workers`;
- o pacote `workers` declara BullMQ/ioredis, mas sua execução depende de um entrypoint separado e transitional;
- não foi encontrado, no índice de busca de código disponível, uso de `new Queue`, `Queue(`, `redis`, `bullmq` ou `ioredis` fora dos arquivos já identificados como infraestrutura de workers/dependências;
- o produto atual não exige concorrência distribuída, múltiplos workers ou processamento horizontal para cumprir 5 posts/dia e gerar o lote mensal de 150 posts.

A remoção deverá ocorrer somente na Fase 2, preservando qualquer regra funcional útil encontrada dentro de `workers`.

---

## 2. Arquitetura atual observada

```text
ldm_bot
├── apps/api
├── apps/web
├── apps/workers
└── packages/shared
```

O root declara workspaces para `apps/*` e `packages/*`. Também possui scripts dedicados para API, Web e Workers. O script de teste do root aponta para o workspace `workers`, o que torna a suíte atual dependente da estrutura que pretendemos simplificar.

Fonte: `package.json`.

### Arquitetura desejada após a refatoração

```text
ldm_bot
├── apps/web
├── apps/api
├── supabase
├── docs
└── packages/shared   ← somente se continuar justificadamente útil
```

O objetivo não é obrigatoriamente renomear/mover tudo imediatamente; a prioridade é eliminar acoplamento e infraestrutura sem função comprovada.

---

## 3. Fato crítico: API → Workers

`apps/api/src/index.ts` importa:

```ts
import { loadEnv } from '../../workers/src/config/env.js';
```

Isso significa que a API não é autônoma. Seu bootstrap depende de código pertencente ao processo de workers.

`apps/api/src/services/crawlerService.ts` também importa diretamente:

```ts
import { affiliateLinkService } from '../../../workers/src/services/affiliateLinkService.js';
```

Esse é o principal problema arquitetural encontrado: **a API consome implementação interna do Worker em vez de depender de uma camada própria ou compartilhada bem definida.**

### Classificação

**ALTA — corrigir na Fase 2.**

### Decisão

- mover `loadEnv` para `apps/api/src/config/env.ts` ou módulo comum mínimo;
- mover a persistência de affiliate links para a API;
- remover imports `../../../workers/...` da API;
- não criar uma nova abstração complexa para substituir esses imports.

---

## 4. Redis / BullMQ / ioredis

### API

`apps/api/package.json` declara:

- `bullmq`
- `ioredis`

Porém o código de entrada da API não instancia Redis nem uma fila. O crawler é chamado diretamente pela rota.

### Workers

`apps/workers/package.json` declara:

- `bullmq`
- `ioredis`
- Playwright
- Supabase

O entrypoint `apps/workers/src/index.ts` instancia Redis:

```ts
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
createProcessors(redis);
```

e é explicitamente comentado como **transitional**.

### Evidência adicional

A busca de código não encontrou chamadas explícitas para `new Queue` ou `Queue(` no índice disponível. A referência a `createProcessors(redis)` não pôde ser resolvida para `apps/workers/src/queues/worker.ts` no endpoint de conteúdo, portanto **a implementação interna dos processors não deve ser presumida como inexistente**.

### Conclusão

A evidência é suficiente para classificar Redis/BullMQ como **candidato forte à remoção**, mas a migração deve primeiro preservar qualquer processor funcional existente.

**Prioridade: ALTA.**

---

## 5. Workers

O worker possui dois papéis aparentes:

1. inicializar processors de fila;
2. opcionalmente executar `runLojaDoMecanicoCrawler()` quando `RUN_LDM_CRAWLER=true`.

O crawler, entretanto, já possui uma implementação dentro da API (`CrawlerService`) e a rota chama essa implementação diretamente.

Isso indica duplicação ou migração incompleta de responsabilidades.

### Decisão

Na Fase 2:

- identificar cada arquivo útil de `workers`;
- migrar somente lógica funcional necessária;
- eliminar o processo separado de worker;
- eliminar Redis/BullMQ se nenhum fluxo real depender deles após a migração.

---

## 6. Crawler

Arquivo principal:

`apps/api/src/services/crawlerService.ts`

Responsabilidades atualmente acumuladas:

- conexão Playwright via Chrome CDP;
- criação/gerenciamento de página;
- configuração de browser;
- login na Loja do Mecânico;
- navegação por categorias;
- extração de URLs de produtos;
- extração de produto;
- parsing de preço;
- scoring;
- anti-repetição;
- rotação de categorias;
- persistência de affiliate links;
- fechamento do browser.

### Problemas

O serviço está grande demais e mistura automação, regras de seleção e persistência.

Também existe um cast suspeito ao transformar o resultado de anti-repetição em `AffiliateLink`:

```ts
as unknown as AffiliateLink[]
```

Isso mascara incompatibilidade de tipos e deverá ser corrigido na Fase 2/3.

O método `saveProducts()` consulta e grava produto por produto, o que pode gerar muitas operações de banco para lotes maiores.

### Decisão

**ALTERAR, não reescrever.**

Separar apenas responsabilidades que realmente reduzam acoplamento:

```text
Crawler/Playwright
        ↓
Produto extraído
        ↓
Scoring / seleção
        ↓
Persistência
```

Sem criar dezenas de classes ou repositories sem necessidade.

---

## 7. Execução do crawler

`apps/api/src/routes/crawler.ts` faz:

```ts
const crawler = new CrawlerService(config);
const result = await crawler.runCrawl();
```

Portanto, atualmente o HTTP request fica bloqueado até a execução terminar.

### Decisão

Para o fluxo mensal de 150 posts, a execução longa não deverá permanecer presa a uma requisição HTTP.

A solução prevista para V1 é:

```text
POST /monthly-plans/execute
        ↓
cria run no Supabase
        ↓
retorna runId
        ↓
processo assíncrono dentro da API
        ↓
progresso persistido no Supabase
```

**Sem Redis/BullMQ.**

A execução poderá ser retomada manualmente a partir do estado persistido se o processo cair.

---

## 8. Facebook

Arquivo principal:

`apps/api/src/services/facebookPublisher.ts`

A implementação já usa Playwright + Chrome CDP e possui mecanismos de:

- conexão via CDP;
- detecção de login;
- fallback de seletores;
- confirmação pós-publicação;
- screenshots de erro/sucesso;
- tratamento de sessão não autenticada.

### Ponto de atenção

A implementação atual é orientada à publicação imediata (`Publicar`). O objetivo da refatoração exige **agendamento**, seguindo obrigatoriamente o fluxo real documentado em:

`docs/FACEBOOK_SCHEDULING_FLOW.md`

Contrato funcional já mapeado:

```text
Escreva algo...
→ texto
→ link
→ preview
→ @todos via autocomplete
→ Programar post
→ data
→ hora
→ Programar
→ Posts programados
→ confirmação
```

A documentação existente deve ser tratada como contrato operacional, não como sugestão.

---

## 9. NVIDIA / IA

Nesta Fase 1, a auditoria estrutural não encontrou motivo para substituir a estratégia de IA existente.

A integração de IA deverá permanecer isolada atrás de uma interface simples no fluxo futuro:

```text
produto
  ↓
NVIDIA
  ↓
cópia do post
```

Regras funcionais já definidas permanecem válidas:

- não colocar preço no texto;
- usar o link de afiliado como fonte do preço atual;
- gerar variações de copy;
- não repetir silenciosamente o mesmo produto 150 vezes.

As três chaves NVIDIA existentes em ambiente não devem ser expostas nem duplicadas no código.

---

## 10. Web

A Web é a parte menos problemática da arquitetura atual.

O `apps/web/package.json` usa React 19 + Vite + TypeScript e possui uma estrutura relativamente direta.

### Decisão

**Não reescrever a Web.**

Apenas:

- corrigir chamadas necessárias para a nova API;
- criar a interface de plano mensal/agendamento;
- acompanhar execução por `runId`;
- remover código morto somente quando comprovado.

---

## 11. Shared package

`packages/shared` contém tipos, logger e regras de planner, incluindo:

- `productScore`;
- `antiRepetition`;
- `categoryRotation`;
- tipos de configuração;
- filas/jobs exportados.

### Decisão

Não remover automaticamente.

Durante a Fase 2 será separado entre:

- código realmente compartilhado entre Web/API;
- código exclusivamente backend;
- resíduos relacionados a filas/jobs que serão eliminados com Redis/BullMQ.

A regra será **manter o mínimo necessário**.

---

## 12. Configuração e ambiente

`.env.example` ainda declara Redis como obrigatório para Workers e contém referências a legado/Gemini.

Também há uma configuração de credenciais da Loja do Mecânico e CDP.

O `loadEnv()` atual fica em `workers/src/config/env.ts` e exige `REDIS_URL`, reforçando o acoplamento da API à infraestrutura de Worker.

### Decisão

Na Fase 2:

- criar configuração própria da API;
- remover `REDIS_URL` quando Redis for eliminado;
- manter apenas variáveis realmente usadas;
- revisar referências legadas;
- nunca mover segredos para código-fonte.

---

## 13. Mocks / fake / dummy / hardcoded

Buscas textuais no índice de código não encontraram ocorrências relevantes para `mock` ou `TODO`.

Isso **não prova ausência total de código artificial**, pois buscas textuais não substituem análise semântica.

Durante as fases seguintes, qualquer dado fake, mock, placeholder funcional ou hardcode operacional deverá ser classificado explicitamente.

Hardcodes legítimos de negócio, como horários, grupo e timezone, podem permanecer como configuração/defaults, mas não como dados simulados.

---

## 14. Build / testes

O root possui:

```text
build          → npm run build --workspaces
test           → npm run test --workspace=@forge-deals/workers
build:api      → build da API
build:web      → build da Web
```

O problema é que:

- `workers build` é apenas `echo "TODO: add build"`;
- `workers lint` é apenas `echo "TODO: add eslint"`;
- o teste raiz depende do workspace Workers.

Isso mostra que a infraestrutura de validação está acoplada a uma parte que pretendemos retirar.

### Decisão

Na Fase 5, a validação será reorganizada para testar diretamente:

- API;
- Web;
- regras de domínio;
- crawler em modo controlado;
- Facebook em teste controlado;
- fluxo mensal;
- idempotência.

---

## 15. Banco / Supabase

O repositório possui configuração `supabase/`, mas a listagem atual não expôs uma pasta de migrations no endpoint consultado.

Portanto, nesta Fase 1 **não foi feita nenhuma afirmação sobre o schema remoto real**.

O próximo passo de banco deverá ser uma inspeção direcionada às tabelas usadas pelo fluxo:

- affiliate_links;
- affiliate_price_history;
- crawler_logs;
- posts;
- novas tabelas de monthly_plans/scheduled_posts, se ainda não existirem.

### Regra

Não criar tabelas duplicadas nem alterar schema baseado em suposição.

---

## 16. Classificação final

| Componente | Decisão | Prioridade |
|---|---|---:|
| `apps/web` | MANTER | Baixa |
| `apps/api` | MANTER + simplificar | Alta |
| `apps/workers` | MIGRAR/REMOVER | Alta |
| Redis | REMOVER se confirmação final não revelar uso funcional | Alta |
| BullMQ | REMOVER | Alta |
| ioredis | REMOVER com Redis | Alta |
| `packages/shared` | REDUZIR | Média |
| Crawler | ALTERAR | Alta |
| Facebook Publisher | ALTERAR para scheduling | Alta |
| NVIDIA | MANTER | Alta |
| Supabase | MANTER como source of truth | Alta |
| documentação | MANTER/ATUALIZAR | Média |

---

## 17. Riscos identificados

### R1 — Remover Workers e perder lógica funcional
**Mitigação:** migrar e validar cada responsabilidade antes de apagar arquivos.

### R2 — Facebook mudar seletores/UI
**Mitigação:** seguir o fluxo documentado e usar locators semânticos + confirmação real.

### R3 — sessão do Chrome expirar
**Mitigação:** detectar sessão e retornar `requires_attention`, sem armazenar senha.

### R4 — lote mensal duplicar posts
**Mitigação:** idempotência por plano/data/produto e estado persistido.

### R5 — quantidade insuficiente de produtos
**Mitigação:** nunca duplicar silenciosamente; reportar quantidade disponível e política de fallback.

### R6 — processo da API cair durante lote
**Mitigação:** persistir estado de cada item; permitir retomada manual.

---

## 18. Escopo da Fase 2 aprovado

A Fase 2 poderá começar com as seguintes mudanças, nesta ordem:

1. criar `apps/api/src/config/env.ts`;
2. eliminar dependência API → `workers/src`;
3. mover persistência necessária de affiliate links para API;
4. mapear/migrar processors úteis;
5. remover dependências BullMQ/ioredis da API;
6. remover processo Workers se nenhuma responsabilidade funcional restar;
7. limpar exports de filas/jobs do shared;
8. executar build/typecheck;
9. corrigir regressões antes de seguir.

**Não alterar o fluxo Facebook ou o banco mensal nesta primeira etapa de simplificação sem necessidade.**

---

## 19. Critério de encerramento da Fase 1

A Fase 1 está concluída porque temos:

- [x] arquitetura atual identificada;
- [x] workspaces e scripts auditados;
- [x] dependência API → Workers identificada;
- [x] Redis/BullMQ/ioredis classificados com evidências;
- [x] Workers classificados como transitional e candidatos à remoção;
- [x] crawler inventariado;
- [x] Facebook inventariado;
- [x] Web classificada como baixa prioridade de refatoração;
- [x] shared classificado para redução seletiva;
- [x] mocks/TODO pesquisados;
- [x] build/test scripts identificados;
- [x] limitações da auditoria de Supabase registradas sem inventar dados;
- [x] riscos registrados;
- [x] plano concreto da Fase 2 definido.

## Status final

**FASE 1 — CONCLUÍDA.**

Princípio para a próxima fase:

> **Remover complexidade, não funcionalidade.**
