# Decision Log — ForgeDeals

Registro de decisões arquiteturais (ADR). Formato: contexto, decisão, consequências.

---

## ADR-001: Mover SystemConfig e planner para packages/shared (shared kernel)

**Data:** 2026-09-08
**Agente:** backend (agente Backend Services)
**Status:** Aceita

### Contexto

`apps/api` dependia de `apps/web/src` — acoplamento invertido (backend → frontend):

- `apps/api/src/config/configStore.ts`, `routes/config.ts`, `services/facebookPublisher.ts`, `services/crawlerService.ts`, `services/ollamaService.ts` importavam `../../../web/src/types/config.js` (contrato `SystemConfig` + `DEFAULT_CONFIG`)
- `apps/api/src/services/crawlerService.ts` e `routes/crawler.ts` importavam `../../../web/src/planner/*` (`ProductScorer`, `AntiRepetition`, `CategoryRotation`, `CATEGORIES`)

`SystemConfig` é o contrato de configuração operacional do sistema inteiro (crawler, publisher, planner) e o planner é lógica de domínio consumida pela camada server-side; ambos pertencem ao shared kernel, não ao frontend.

### Decisão

Mover para `packages/shared`:

- `apps/web/src/types/config.ts` → `packages/shared/src/types/config.ts` (via `git mv`, histórico preservado)
- `apps/web/src/planner/*` (productScore, antiRepetition, categoryRotation, types) → `packages/shared/src/planner/*`

Ajustes:

- `packages/shared/package.json` ganhou exports `./types/config`, `./planner/*` e `"."` (barrel `src/index.ts`)
- `apps/api` (6 arquivos) e `apps/web` (2 páginas) passaram a importar `@forge-deals/shared/...`
- `apps/web/package.json` ganhou dependência `@forge-deals/shared` (`file:../../packages/shared`)
- Arquivos movidos deletados de web (sem re-export de compatibilidade — todos os importers atualizados)

### Consequências

Positivas:

- Acoplamento invertido eliminado: `apps/api` não importa mais nenhum arquivo de `apps/web/src` (verificado: 0 ocorrências de `web/src/types/config` e `web/src/planner` no repo)
- Contrato de configuração e planner agora no shared kernel, consumível por api/web/workers
- Barrel `@forge-deals/shared` exporta todos os tipos; subpaths granulares mantidos (retrocompatível com imports existentes `@forge-deals/shared/types`, `/logger`, `/queues`, `/jobs`)

Negativas / atenções:

- `Product` exportado por `planner/productScore.ts` colide com `Product` de `src/types.ts`; barrel exporta `ProductScorer`/`ScoredProduct` explicitamente, omitindo `Product` do productScore (consumidores usam o subpath direto se precisarem do tipo)
- Dependência nova de `apps/web` → `@forge-deals/shared` (necessária para importar o contrato)

### Verificação

- `apps/api` tsc --noEmit: 0 erros
- `apps/web` tsc --noEmit: 0 erros
- `packages/shared` tsc --noEmit: 0 erros
- `npm run build` root: exit 0
- grep `web/src/types/config|web/src/planner`: 0 ocorrências (exceto menção histórica em DELETION_LOG.md)

---