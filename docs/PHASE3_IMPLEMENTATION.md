# LDM Bot — Fase 3: Fluxo de negócio e persistência

**Status:** EM EXECUÇÃO

## Implementado

- Identidade canônica de produto em `packages/shared/src/planner/productIdentity.ts`.
- SKU tem prioridade quando disponível; sem SKU, a identidade usa marca + modelo/nome + variante + voltagem + categoria.
- Preço, descrição e URL não fazem parte da identidade.
- Geração determinística dos 150 slots mensais.
- Horários fixos: 09:00, 11:00, 14:00, 17:00 e 20:00.
- Timezone de negócio: `America/Sao_Paulo`.
- Seleção persistente a partir de `affiliate_links` monitorados.
- Bloqueio de repetição por identidade dentro do plano.
- Exclusão de afiliados publicados nos 30 dias anteriores.
- Ranking por `opportunity_score` com penalização por concentração de categoria/marca.
- Preenchimento dos slots existentes sem criar posts adicionais.
- Geração de copy via NVIDIA NIM usando Llama 4 Maverick.
- Copy não recebe preço como entrada e é rejeitada se contiver padrões de preço/valor comercial.
- Geração idempotente: posts que já possuem `content` não são regenerados.
- Rotas API registradas:
  - `POST /api/monthly-plans`
  - `POST /api/monthly-plans/:id/fill`
  - `POST /api/monthly-plans/:id/generate`
  - `GET /api/monthly-plans/:id`

## Fluxo operacional

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
Fase 4 — Facebook Scheduler
```

## Política de quantidade

O sistema não duplica produtos para artificialmente completar 150 slots. Se houver menos produtos elegíveis que slots, o retorno informa `selected`, `remaining` e `selectionComplete=false`.

## Limite desta fase

A publicação/agendamento real no Facebook permanece fora da Fase 3.

Também não foi criado um schema Supabase novo às cegas: o repositório atualmente não contém migrations expostas para validar a estrutura remota de `posts`/`monthly_plans`. A implementação usa somente as colunas já consumidas pelo código existente. A criação/ajuste de migration deve ocorrer depois de confirmar o schema remoto.

## Variáveis

```text
NVIDIA_API_KEY
NVIDIA_MODEL (opcional; default Llama 4 Maverick)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Próximos blocos

1. Confirmar schema remoto de `monthly_plans` e `posts`.
2. Persistir explicitamente identidade/histórico quando o schema remoto for confirmado.
3. Adicionar cobertura de testes para identidade, 150 slots, duplicação e idempotência.
4. Integrar a Web ao fluxo de criação/visualização.
5. Encerrar Fase 3 somente após validação funcional; Facebook permanece Fase 4.
