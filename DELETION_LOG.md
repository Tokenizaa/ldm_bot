# DELETION_LOG — Refactor "Operational Panel Architecture"

Data: 2026-09-08
Agente: Refactor Cleaner
Baseline antes da limpeza: web tsc 0 erros, api tsc 0 erros, `npm run build` exit 0 (pós build-error-resolver).

## Arquivos deletados

### Legacy raiz `apps/web/src/*.ts` — substituídos por API/novas páginas
| Arquivo | Motivo | Verificação |
|---|---|---|
| `apps/web/src/browser.ts` | legacy browser config; zero imports em todo o repo | `rg "browser"` em apps → 0 refs reais |
| `apps/web/src/crawler.ts` | legacy crawler; substituído por `apps/api/src/services/crawlerService.ts` + `pages/CrawlerEngine.tsx` (morto, ver abaixo) | 0 refs reais |
| `apps/web/src/database.ts` | legacy DB; zero imports | 0 refs reais |
| `apps/web/src/facebook.ts` | legacy FB; substituído por `apps/api/src/services/facebookPublisher.ts` | 0 refs reais |
| `apps/web/src/facebook.ts` → notas: nenhum import em api/workers | zero imports | `rg "facebook.ts"` 0 refs |
| `apps/web/src/ollama.ts` | legacy Ollama; substituído por `apps/api/src/services/ollamaService.ts` | 0 refs reais |
| `apps/web/src/index.ts` | legacy entry; já excluído do web tsconfig; entry real = `index.html → main.tsx → App.tsx` | 0 refs; main.tsx importa `./App.tsx` |

### Legacy dirs vazios pós-deleção
| Diretório | Motivo |
|---|---|
| `apps/web/src/core/` (Executor.ts) | usado apenas por `index.ts` (deletado acima) |
| `apps/web/src/content/` (templates.ts) | zero imports; importava `planner/types` apenas |
| `apps/web/src/hooks/` (useConfig.ts) | usado apenas pelas páginas mortas OperationalPanel/OperationalAnalytics (deletadas abaixo); hook vivo = `context/ConfigContext.tsx` |

### Páginas mortas `apps/web/src/pages/` — não roteadas no App.tsx, imports inexistentes ou zero refs
| Arquivo | Motivo |
|---|---|
| `ProductList.tsx` | rota removida de App.tsx; importava `../services/productService` e `../types` (inexistentes); estava excluída do tsconfig |
| `ProductDetails.tsx` | idem (`../services/*`, `../types`) |
| `AffiliateLinkManager.tsx` | idem (`../hooks/useAffiliateLinks`, `../services/*`, `../types`) |
| `CrawlerEngine.tsx` | **NÃO roteado em App.tsx** (App.tsx roteia apenas Dashboard, FacebookControlCenter, Analytics, OllamaCenter, ContentPlanner, Settings). Resumo de projeto com "13 páginas" está desatualizado. Importava `../hooks/useSupabase` + `../types` (inexistentes). Excluído do tsconfig. **Deletado com segurança — nenhuma página ativa importa.** |
| `AffiliateWorker.tsx` | não roteado; zero refs externos |
| `PlaywrightWorker.tsx` | não roteado; zero refs externos |
| `Automation.tsx` | não roteado; zero refs externos |
| `FacebookSettings.tsx` | não roteado; zero refs externos |
| `OperationalAnalytics.tsx` | não roteado; usava `hooks/useConfig` (deletado junto) |
| `Categories.tsx` | não roteado; zero refs externos (fora da lista original; mesmo padrão morto, removido) |
| `Groups.tsx` | não roteado; zero refs externos (idem) |
| `SocialControlCenter.tsx` | não roteado; zero refs externos (idem) |
| `OperationalPanel.tsx` | não roteado; usava `hooks/useConfig` (idem) |

### Componentes mortos `apps/web/src/components/`
| Arquivo | Motivo |
|---|---|
| `ActivityTimeline.tsx` | zero imports em App.tsx/pages |
| `PostCard.tsx` | zero imports |
| `QuickActions.tsx` | zero imports |
| `StatusCard.tsx` | zero imports (Dashboard define StatusCard local próprio) |
| `ProductCard.tsx` | zero imports |
| `operational/MetricCard.tsx` | zero imports (Dashboard define MetricCard local próprio) |
| `operational/StatusCard.tsx` | zero imports; duplicata do root StatusCard |

### Mantidos (comprovadamente usados)
- `apps/web/src/types/config.ts` — contrato SystemConfig; importado por apps/api (configStore, routes/config, facebookPublisher, ollamaService)
- `apps/web/src/planner/*` (types, antiRepetition, categoryRotation, productScore) — importado por apps/api/src/services/crawlerService.ts + routes/crawler.ts
- `apps/web/src/lib/api.ts` — usado por Settings, OllamaCenter, FacebookControlCenter, ConfigContext
- `apps/web/src/lib/utils.ts` — usado por todas as páginas vivas + Sidebar/Topbar
- `apps/web/src/components/Sidebar.tsx`, `Topbar.tsx` — usados por App.tsx
- Páginas: Dashboard, FacebookControlCenter, Analytics, OllamaCenter, ContentPlanner, Settings (roteadas em App.tsx)

## Config limpa
- `apps/web/tsconfig.json` — removida chave `exclude` (apontava para arquivos agora deletados: src/index.ts, src/core, src/content, 4 páginas).

## Comandos de verificação (todos verdes após a limpeza)
```
cd apps/web && node ../../node_modules/typescript/bin/tsc --noEmit   → 0 erros
cd apps/api && node ../../node_modules/typescript/bin/tsc --noEmit   → 0 erros
npm run build (raiz)                                                  → exit 0
```

## PARADAS / não deletado
Nenhuma. Nota: `planner/` e `types/config.ts` foram inicialmente suspeitos (importados só por legacy web), mas **apps/api importa diretamente** — fora de escopo, mantidos.

---

## Limpeza 2 — tsconfig raiz orphan (2026-09-08)

Agente: Build Error Resolver

### Arquivo deletado

| Arquivo | Motivo | Verificação |
|---|---|---|
| `tsconfig.json` (raiz) | Orphan legacy. `include` apontava para 6 arquivos inexistentes (`src/browser.ts`, `src/crawler.ts`, `src/database.ts`, `src/facebook.ts`, `src/index.ts`, `src/ollama.ts`). Nenhum script/package.json referencia esse tsconfig. Apps/api e apps/web estendem `tsconfig.base.json` (mantido). | `grep -rn "tsconfig" package.json apps/*/package.json packages/*/package.json` → 0 refs ao tsconfig raiz |

### Mantido
- `tsconfig.base.json` (raiz) — estendido por `apps/api/tsconfig.json` e `apps/web/tsconfig.json`

### Comandos de verificação (todos verdes após a deleção)
```
cd apps/api && node ../../node_modules/typescript/bin/tsc --noEmit   → 0 erros
cd apps/web && node ../../node_modules/typescript/bin/tsc --noEmit   → 0 erros
npm run build (raiz)                                                  → exit 0
```

---

## Limpeza 3 — schemas SQL duplicados (2026-09-08)

Agente: Database

### Arquivos deletados

| Arquivo | Motivo | Verificação |
|---|---|---|
| `database-schema.sql` (raiz) | Schema LEGADO pré-monorepo (mai 8). Tabela `products` sem nenhum uso em código (`grep -rn "from('products')" apps` → 0 refs); `posts` legacy (facebook_post_id, status posted) sem refs — código só lê `posts.created_at`. Todo schema usado por código real existe em `supabase-migration.sql` (schema operacional do refactor "operational panel"). Restaurado de git após sumir durante build — drift. Restaurado em `4cb3126` (`atualizaions`). | Tabelas usadas em código (via `.from(...)`): `system_config`, `affiliate_links`, `affiliate_price_history`, `crawler_logs`, `posts` — todas cobertas por `supabase-migration.sql` |
| `supabase/migrations/database-schema.sql` | Byte-idêntico ao raiz (`diff` → IDENTICAL, 1480 bytes). Mesma drift. `supabase db push` nele recriaria schema legacy e quebraria o app (faltariam system_config/affiliate_links/crawler_logs). | `diff database-schema.sql supabase/migrations/database-schema.sql` → IDENTICAL |

### Docs atualizados
- `EXECUTION_CHECKLIST.md` — linhas 25 e 72: referência `database-schema.sql` → `supabase-migration.sql`
- `FINAL_PROJECT_STRUCTURE.md` — linha 65: registro do arquivo → `supabase-migration.sql (Schema Supabase operacional)`

### Schema de verdade (mantido)
- `supabase-migration.sql` (raiz, 7887 bytes, set 8 18:54) — único schema operacional.

### Comandos de verificação (verdes após a deleção)
```
cd apps/api && node ../../node_modules/typescript/bin/tsc --noEmit   → 0 erros
```