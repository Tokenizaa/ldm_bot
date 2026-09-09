# LDM Bot — Fase 5: Validação final e limpeza

**Status: CONCLUÍDA COM GATE OPERACIONAL EXTERNO**

## Objetivo

Encerrar a refatoração em 5 fases validando código, banco, CI e higiene do repositório, sem introduzir novos componentes fora do escopo.

## Escopo executado

- Revisão final do fluxo Fase 3 → Fase 4.
- Validação das migrations aplicadas no Supabase remoto.
- Validação de constraints de estado.
- Validação de RLS nas tabelas operacionais.
- Validação dos índices de scheduler/recovery.
- Validação do CI após a limpeza final.
- Limpeza de artefatos operacionais do Git (`screenshots/`).
- Verificação de que o banco não ficou contaminado por dados de teste.
- Registro explícito do único gate que depende do ambiente Facebook/Chrome do operador.

## Validação CI

Último workflow: `CI #17`

- Run: `34386466879`
- Commit: `36a3e42fb06d09e37afe56d734d21d2fc6bb63ce`
- Resultado: `success`
- Build: aprovado
- Testes API: aprovados

## Validação Supabase

Projeto remoto: `xtjujzjkabffeenhxsib`

Estado encontrado na validação final:

- `monthly_plans`: 0 registros
- `posts`: 0 registros
- `publication_history`: 0 registros
- `affiliate_links`: 1 registro real

Constraints confirmadas:

- Plano: exatamente 30 dias.
- Plano: exatamente 5 posts/dia.
- Plano: exatamente 150 posts.
- Estados de plano compatíveis com o scheduler.
- Estados de post compatíveis com claim/recovery/retry.
- Estados de histórico compatíveis com o ciclo de publicação.

RLS confirmado em:

- `affiliate_links`
- `monthly_plans`
- `posts`
- `publication_history`

Índices críticos confirmados:

- `idx_posts_publishing_started_at`
- `idx_posts_last_attempt_at`
- `idx_posts_due_scheduled`
- `idx_posts_plan_slot`
- `idx_publication_history_post_status`
- `publication_history_post_uq`

## Higiene do repositório

Artefatos gerados durante automação não devem ser versionados. `screenshots/` foi adicionado ao `.gitignore`.

O banco foi conferido após as validações e não contém planos/posts/histórico de teste.

## Gate operacional externo

A publicação real no Facebook exige um Chrome/Chromium já autenticado e acessível via CDP. Playwright suporta essa conexão através de `connectOverCDP`, mas essa etapa depende do ambiente local do operador e não pode ser simulada pelo CI. 

Critério de aceite operacional:

```text
scheduled
  ↓
claim → publishing
  ↓
Chrome/CDP → Facebook
  ↓
confirmação visual
  ↓
permalink/ID real
  ↓
posts = published
publication_history = published
```

Sem esse teste contra o Facebook real, nenhum resultado sintético deve ser usado para marcar uma publicação como `published`.

## Resultado final

A Fase 5 encerra a refatoração técnica e deixa o sistema pronto para o teste operacional controlado no ambiente Facebook configurado pelo operador.

Não foram adicionados mocks, IDs sintéticos ou dados falsos para mascarar a ausência do teste externo.
