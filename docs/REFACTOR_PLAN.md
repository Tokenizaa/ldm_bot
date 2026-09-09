# LDM Bot — Plano de Refatoração

**Status:** Fase 2 em execução  
**Objetivo:** simplificar o LDM Bot existente, preservar o que já funciona e corrigir somente o necessário para chegar a um fluxo confiável de planejamento e agendamento de posts no grupo do Facebook.

## Objetivo funcional

O sistema deve conseguir:

1. coletar produtos/links de afiliado da Loja do Mecânico;
2. selecionar uma quantidade diversificada de produtos;
3. gerar os textos usando NVIDIA;
4. montar um plano de 30 dias com 5 posts por dia (150 posts);
5. agendar os posts diretamente no Facebook usando Playwright/CDP;
6. confirmar no Facebook que cada post realmente ficou agendado.

Horários padrão: **09:00, 11:00, 14:00, 17:00 e 20:00**, timezone `America/Sao_Paulo`.

## Princípios

- **Não reescrever do zero.** O `ldm_bot` atual é a base da refatoração.
- Preservar código funcional antes de substituir.
- Remover complexidade que não entrega valor real.
- Não introduzir Redis, BullMQ ou workers separados sem necessidade comprovada.
- PostgreSQL/Supabase é a fonte de verdade.
- API e Web permanecem separados.
- O código da API não pode importar código de `workers`.
- Facebook é automatizado exclusivamente pelo fluxo real documentado em `docs/FACEBOOK_SCHEDULING_FLOW.md`.
- Nunca registrar sucesso de agendamento sem confirmação real no Facebook.
- Não usar mocks/fakes/dados hardcoded para simular sucesso em produção.
- Não armazenar senhas, cookies, tokens ou chaves em documentação/logs.

## Fases

### Fase 1 — Auditoria e baseline
**Status: CONCLUÍDA em 2026-09-09.**

Saída: `docs/REFACTOR_BASELINE.md`.

Principais conclusões: a Web deve ser preservada; a API precisa ser desacoplada de `workers`; Workers/Redis/BullMQ/ioredis são candidatos fortes à remoção; crawler e Facebook devem ser preservados e simplificados.

### Fase 2 — Simplificação da arquitetura
**Status: EM EXECUÇÃO.**

Objetivo: reduzir a complexidade mantendo o comportamento útil.

Arquitetura alvo:

```text
web/       React + Vite
api/       Fastify + TypeScript
supabase/  PostgreSQL/migrations
```

Ajustes prioritários:

- criar configuração própria da API;
- eliminar dependência da API em código de `workers`;
- migrar para `api` somente o código necessário do crawler e integrações;
- auditar os processors internos antes de remover Workers;
- remover `workers`/Redis/BullMQ/ioredis quando não houver responsabilidade funcional restante;
- reduzir `packages/shared` ao código realmente compartilhado;
- eliminar abstrações que só repassam chamadas;
- corrigir casts inseguros no crawler;
- manter a Web sem reescrita estrutural.

**Critério de conclusão:** Web e API funcionam independentemente e não existe cross-import proibido.

### Fase 3 — Fluxo de negócio e persistência
**Status: PENDENTE.**

Objetivo: tornar o planejamento mensal determinístico e idempotente.

Implementar/corrigir:

```text
Coleta → Seleção → Geração NVIDIA → Plano mensal → Agendamento
```

Requisitos: 30 × 5 = 150 slots; diversidade de produtos; nenhuma duplicação silenciosa; estados persistidos; reexecução idempotente; retomada manual.

### Fase 4 — Facebook Scheduler
**Status: PENDENTE.**

Usar `docs/FACEBOOK_SCHEDULING_FLOW.md` como contrato operacional e confirmar cada agendamento no Facebook antes de persistir `scheduled`.

### Fase 5 — Validação e limpeza final
**Status: PENDENTE.**

Build, typecheck, lint, testes, crawler, NVIDIA, plano mensal, Facebook, idempotência, revisão de env/logs e limpeza final.

## Regra de execução

**Auditar → alterar pequeno bloco → validar → registrar → próximo bloco.**

Nenhuma infraestrutura nova será adicionada sem requisito mensurável que justifique sua existência.
