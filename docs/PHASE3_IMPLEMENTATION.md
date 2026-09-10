# LDM Bot — Fase 3: Planejamento mensal, identidade e geração de conteúdo

**Status: CONCLUÍDA**

## Objetivo

Implementar o motor de planejamento mensal sem duplicação de produto, com identidade canônica, diversidade, persistência, geração de copy por IA e preparação auditável do ciclo de publicação.

## Entregas concluídas

- Identidade canônica em `packages/shared/src/planner/productIdentity.ts`.
- SKU tem prioridade quando disponível; sem SKU, a identidade usa atributos estáveis do produto.
- Preço, descrição e URL não definem identidade.
- Plano mensal determinístico com **150 slots** (`30 dias × 5 posts/dia`).
- Horários fixos: `09:00`, `11:00`, `14:00`, `17:00` e `20:00`.
- Timezone de negócio: `America/Sao_Paulo`.
- Seleção baseada em `affiliate_links` monitorados e `opportunity_score`.
- Bloqueio de repetição por identidade dentro do plano.
- Exclusão de produtos publicados nos 30 dias anteriores.
- Penalização por concentração de categoria e marca.
- Não são criados posts extras para artificialmente completar os 150 slots.
- Geração de copy via NVIDIA NIM / Llama 4 Maverick.
- Preço não é enviado ao agente de copy e padrões comerciais de preço são rejeitados na validação.
- Geração idempotente: posts que já possuem conteúdo não são regenerados.
- Histórico de publicação persistido em `publication_history`.
- Estado operacional de posts preparado para `draft`, `scheduled`, `publishing`, `published` e `failed`.
- Claim transacional antes da publicação para reduzir risco de publicação concorrente.
- Rotas API:
  - `POST /api/monthly-plans`
  - `POST /api/monthly-plans/:id/fill`
  - `POST /api/monthly-plans/:id/generate`
  - `GET /api/monthly-plans/:id`
  - `POST /api/monthly-plans/:id/schedule-facebook`
  - `POST /api/monthly-plans/publish-facebook-due`
- Job executável para publicação de posts vencidos: `npm run publish:facebook-due --workspace=@forge-deals/api`.
- Cobertura automatizada da identidade de produto em `apps/api/src/services/productIdentity.test.ts`.

## Persistência Supabase

A migration `20260909173357_phase3_product_identity_publication_history` foi aplicada ao projeto remoto e criou a infraestrutura de identidade/histórico e as restrições de integridade necessárias para plano, post e afiliado.

A migration `20260909173750_phase3_planner_facebook_lifecycle` também foi aplicada para suportar o ciclo operacional de publicação.

## Fluxo final da Fase 3

```text
affiliate_links
      ↓
Product Identity
      ↓
Eligibility + histórico
      ↓
Diversity Planner
      ↓
150 slots
      ↓
NVIDIA Copy Agent
      ↓
posts persistidos
      ↓
Publication History
      ↓
Fase 4 — automação operacional / execução Facebook
```

## Política de quantidade

Se existirem menos produtos elegíveis que slots, o plano permanece parcial. O sistema não duplica produto para preencher artificialmente os 150 slots.

## Limites da Fase 3

A Fase 3 entrega o planejamento, conteúdo e persistência necessários para publicação. A automação contínua de scheduler, recuperação de execuções presas, retries operacionais e validação de publicação real em grupo ficam formalmente na Fase 4.

## Variáveis

```text
NVIDIA_API_KEY
NVIDIA_MODEL (opcional; default Llama 4 Maverick)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Critério de encerramento

A Fase 3 está encerrada quando o plano mensal pode ser criado, preenchido com produtos elegíveis sem duplicação, receber copies idempotentes, persistir seu histórico e deixar os posts em estado controlado para a execução da Fase 4.
