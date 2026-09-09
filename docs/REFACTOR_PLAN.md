# LDM Bot — Plano de Refatoração

**Status:** Fase 2 concluída — pronto para Fase 3  
**Objetivo:** simplificar o LDM Bot existente, preservar o que já funciona e corrigir somente o necessário para chegar a um fluxo confiável de planejamento e agendamento de posts no grupo do Facebook.

## Fase 1 — Auditoria e baseline
**Status: CONCLUÍDA em 2026-09-09.**

Saída: `docs/REFACTOR_BASELINE.md`.

## Fase 2 — Simplificação da arquitetura
**Status: CONCLUÍDA em 2026-09-09.**

### Resultado

- [x] Configuração própria da API (`apps/api/src/config/env.ts`)
- [x] Serviço de afiliados centralizado na API
- [x] Dependência API → `workers/src/config/env` removida
- [x] Dependência API → `workers/src/services/affiliateLinkService` removida
- [x] `bullmq` removido da API
- [x] `ioredis` removido da API
- [x] Browser/CDP centralizado na API
- [x] Crawler executado pela API, sem dependência funcional de Workers
- [x] Responsabilidades úteis do browser já existentes na API preservadas
- [x] Publisher Facebook legado (stub) não migrado
- [x] Serviço Ollama duplicado removido
- [x] `TabsManager` legado removido
- [x] `portDetector` legado removido
- [x] Runtime `apps/workers` removido
- [x] Scripts raiz de Workers/testes dependentes de Workers removidos
- [x] Nenhum resultado de código para `workers`, `redis` ou `ioredis` nas buscas do repositório após a limpeza

### Decisões

- Web e API permanecem separados.
- A API é o único runtime de automação do LDM Bot.
- Playwright/CDP permanece na API porque é requisito do crawler e do futuro Facebook Scheduler.
- Redis/BullMQ não fazem parte da arquitetura V1.
- O crawler legado não será duplicado: a implementação atual da API é a base para a Fase 3.
- O publisher Facebook stub não será aproveitado como implementação funcional; a Fase 4 usará o fluxo real documentado em `docs/FACEBOOK_SCHEDULING_FLOW.md`.

### Arquitetura resultante

```text
web/       React + Vite
api/       Fastify + TypeScript + Playwright
supabase/  PostgreSQL/migrations
```

### Validação posterior

A regeneração completa do `package-lock.json` e a validação final de `build/typecheck/test` ficam registradas para a etapa de validação final, evitando misturar limpeza estrutural com validação funcional.

## Fase 3 — Fluxo de negócio e persistência
**Status: PRÓXIMA.**

Coleta → Seleção → Geração NVIDIA → Plano mensal → Agendamento.

30 dias × 5 horários = 150 posts.

## Fase 4 — Facebook Scheduler
**Status: PENDENTE.**

Usar `docs/FACEBOOK_SCHEDULING_FLOW.md` como contrato operacional.

## Fase 5 — Validação e limpeza final
**Status: PENDENTE.**

Regenerar lockfile, build, typecheck, testes, crawler, NVIDIA, planejamento, Facebook e idempotência.

## Regra de execução

**Auditar → alterar pequeno bloco → validar → registrar → próximo bloco.**

Nenhuma infraestrutura nova será adicionada sem requisito mensurável que justifique sua existência.
