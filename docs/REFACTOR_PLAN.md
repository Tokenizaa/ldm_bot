# LDM Bot — Plano de Refatoração

**Status:** Fase 2 em execução  
**Objetivo:** simplificar o LDM Bot existente, preservar o que já funciona e corrigir somente o necessário para chegar a um fluxo confiável de planejamento e agendamento de posts no grupo do Facebook.

## Fase 1 — Auditoria e baseline
**Status: CONCLUÍDA em 2026-09-09.**

Saída: `docs/REFACTOR_BASELINE.md`.

## Fase 2 — Simplificação da arquitetura
**Status: EM EXECUÇÃO.**

### Concluído nesta etapa

- [x] Configuração própria da API (`apps/api/src/config/env.ts`)
- [x] Serviço de afiliados migrado para a API
- [x] Dependência API → `workers/src/config/env` removida
- [x] Dependência API → `workers/src/services/affiliateLinkService` removida
- [x] `bullmq` removido das dependências da API
- [x] `ioredis` removido das dependências da API
- [x] Configuração de browser/CDP iniciada dentro da API
- [x] Conector CDP simplificado dentro da API
- [x] Monitor de sessão necessário para o fluxo migrado para a API
- [x] `CrawlerService` passou a usar as utilidades de browser da API
- [x] Dependência funcional do crawler em código de `workers` removida

### Pendente nesta fase

- [ ] Auditar e migrar somente responsabilidades ainda necessárias de `apps/workers`
- [ ] Migrar/validar o crawler legado antes de removê-lo definitivamente
- [ ] Migrar o publisher Facebook legado somente se alguma capacidade útil ainda não existir na API
- [ ] Revisar `packages/shared` e remover apenas contratos que deixarem de ser usados
- [ ] Atualizar `package-lock.json` para refletir a remoção das dependências
- [ ] Corrigir eventuais erros de TypeScript/build após as migrações
- [ ] Remover `apps/workers` somente após provar que não há responsabilidade funcional restante
- [ ] Validar que não existe nenhum import API → Workers

### Arquitetura alvo

```text
web/       React + Vite
api/       Fastify + TypeScript + Playwright
supabase/  PostgreSQL/migrations
```

Redis/BullMQ não fazem parte da arquitetura alvo neste momento.

## Fase 3 — Fluxo de negócio e persistência
**Status: PENDENTE.**

Coleta → Seleção → Geração NVIDIA → Plano mensal → Agendamento.

30 dias × 5 horários = 150 posts.

## Fase 4 — Facebook Scheduler
**Status: PENDENTE.**

Usar `docs/FACEBOOK_SCHEDULING_FLOW.md` como contrato operacional.

## Fase 5 — Validação e limpeza final
**Status: PENDENTE.**

Build, typecheck, testes, crawler, NVIDIA, planejamento, Facebook e idempotência.

## Regra de execução

**Auditar → alterar pequeno bloco → validar → registrar → próximo bloco.**

Nenhuma infraestrutura nova será adicionada sem requisito mensurável que justifique sua existência.
