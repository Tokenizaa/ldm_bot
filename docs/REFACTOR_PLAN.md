# LDM Bot — Plano de Refatoração

**Status:** Fase 3 em execução  
**Objetivo:** simplificar o LDM Bot existente, preservar o que já funciona e corrigir somente o necessário para chegar a um fluxo confiável de planejamento e agendamento de posts no grupo do Facebook.

## Fase 1 — Auditoria e baseline
**Status: CONCLUÍDA em 2026-09-09.**

Saída: `docs/REFACTOR_BASELINE.md`.

## Fase 2 — Simplificação da arquitetura
**Status: CONCLUÍDA em 2026-09-09.**

API como único runtime de automação; Workers, BullMQ e Redis removidos da V1.

## Fase 3 — Fluxo de negócio e persistência
**Status: EM EXECUÇÃO.**

### Objetivo

Implementar o fluxo persistente:

```text
Coleta → Seleção → Geração NVIDIA → Plano mensal → Agendamento
```

Regra do plano: **30 dias × 5 horários = 150 posts**.

Horários fixos: `09:00`, `11:00`, `14:00`, `17:00`, `20:00`.
Timezone: `America/Sao_Paulo`.

### Concluído nesta etapa

- [x] Persistência de `monthly_plans`.
- [x] Vínculo dos posts ao plano mensal.
- [x] 150 slots determinísticos por plano.
- [x] Índice único por período.
- [x] Índice único por horário dentro do plano.
- [x] Proteção contra repetir o mesmo affiliate no mesmo plano.
- [x] Serviço API para criar/consultar plano.
- [x] Endpoint `POST /api/monthly-plans`.
- [x] Endpoint `GET /api/monthly-plans/:id`.
- [x] Gerador compartilhado de slots mensais.

### Próximo bloco

- [ ] Integrar produtos elegíveis reais do crawler/affiliate_links.
- [ ] Persistir seleção sem repetir produtos dentro do plano.
- [ ] Integrar geração NVIDIA sem incluir preço no copy.
- [ ] Preencher os 150 posts com produto, link, imagem e copy.
- [ ] Implementar idempotência e estados de geração.
- [ ] Conectar frontend ao fluxo de criação/visualização do plano.

**Não iniciar Facebook Scheduler nesta fase.** A automação real do Facebook permanece reservada para a Fase 4.

## Fase 4 — Facebook Scheduler
**Status: PENDENTE.**

Usar `docs/FACEBOOK_SCHEDULING_FLOW.md` como contrato operacional.

## Fase 5 — Validação e limpeza final
**Status: PENDENTE.**

Regenerar lockfile, build, typecheck, testes, crawler, NVIDIA, planejamento, Facebook e idempotência.

## Regra de execução

**Auditar → alterar pequeno bloco → validar → registrar → próximo bloco.**

Nenhuma infraestrutura nova será adicionada sem requisito mensurável que justifique sua existência.
