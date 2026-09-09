# LDM Bot — Fase 4: Automação operacional e execução Facebook

**Status: EM EXECUÇÃO**

## Objetivo

Transformar o fluxo preparado na Fase 3 em execução operacional contínua, com scheduler, claim concorrente, retries limitados e recuperação de publicações interrompidas.

## Entregas implementadas

- Scheduler contínuo dentro do processo da API.
- Intervalo configurável por `FACEBOOK_PUBLISH_INTERVAL_MS` (mínimo efetivo de 30s; padrão 60s).
- Lote configurável por `FACEBOOK_PUBLISH_BATCH_SIZE` (1–20; padrão 5).
- Execução imediata do publisher na inicialização da API.
- Proteção contra sobreposição de ciclos no mesmo processo.
- Claim transacional `scheduled → publishing`.
- Registro de `publishing_started_at` e `last_attempt_at`.
- Recuperação de execuções presas em `publishing` após 15 minutos.
- Limite de 3 tentativas por post.
- Retry automático de falhas transitórias.
- Transição definitiva para `failed` quando o limite é excedido.
- Atualização consistente de `posts` e `publication_history`.
- Índices para busca eficiente de posts vencidos e estados de publicação.
- Job manual preservado para operação/diagnóstico: `npm run publish:facebook-due --workspace=@forge-deals/api`.

## Fluxo operacional

```text
posts (scheduled)
       ↓
 scheduler
       ↓
 claim atômico
       ↓
 publishing
       ↓
 Facebook / CDP
   ↙         ↘
published   failure
              ↓
       retry / recovery
              ↓
        failed (max 3)
```

## Configuração

```text
FACEBOOK_PUBLISH_INTERVAL_MS=60000
FACEBOOK_PUBLISH_BATCH_SIZE=5
```

## Segurança operacional

O scheduler não publica posts em estado diferente de `scheduled`, utiliza claim condicionado ao estado atual e limita tentativas. Execuções interrompidas não permanecem indefinidamente em `publishing`.

## Limite atual

A Fase 4 ainda precisa de validação ponta a ponta em ambiente de execução com Chrome/CDP e grupo Facebook configurado. A publicação real não deve ser considerada validada apenas pela existência do scheduler.

## Próximo critério de encerramento

A Fase 4 será concluída após build/testes, execução controlada do scheduler, validação de recovery/retry e teste controlado de publicação em grupo real.
