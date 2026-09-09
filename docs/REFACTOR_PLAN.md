# LDM Bot — Plano de Refatoração

**Status:** Em andamento  
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

O preço não deve ser incluído no texto do post. O link de afiliado deve apontar para o produto e não deve receber UTM desnecessário.

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
**Objetivo:** entender o estado atual sem alterar comportamento.

- auditar `web`, `api`, `workers`, `supabase` e `docs`;
- identificar o que é usado de verdade;
- mapear dependências e imports entre aplicações;
- localizar Redis/BullMQ/ioredis e verificar se há necessidade real;
- localizar mocks, dados fake, duplicações e código morto;
- validar build, lint e testes existentes;
- registrar riscos e arquivos que serão alterados.

**Saída:** `docs/REFACTOR_BASELINE.md`.

**Critério de conclusão:** temos uma lista objetiva de alterações, sem refatoração especulativa.

### Fase 2 — Simplificação da arquitetura
**Objetivo:** reduzir a complexidade mantendo o comportamento útil.

Arquitetura alvo:

```text
web/       React + Vite
api/       Fastify + TypeScript
supabase/  PostgreSQL/migrations
```

Ajustes prioritários:

- eliminar dependência da API em código de `workers`;
- trazer para `api` somente o código necessário do crawler e integrações;
- remover `workers`/Redis/BullMQ/ioredis se a auditoria confirmar que não são necessários;
- eliminar abstrações que só repassam chamadas;
- manter serviços simples e coesos;
- remover código legado comprovadamente sem uso.

**Critério de conclusão:** Web e API funcionam independentemente e não existe cross-import proibido.

### Fase 3 — Fluxo de negócio e persistência
**Objetivo:** tornar o planejamento mensal determinístico e idempotente.

Implementar/corrigir o fluxo:

```text
Coleta → Seleção → Geração NVIDIA → Plano mensal → Agendamento
```

Requisitos:

- 30 dias × 5 horários = 150 slots;
- evitar repetir o mesmo produto silenciosamente;
- se não houver 150 produtos elegíveis, informar claramente a insuficiência;
- registrar cada post e seu estado no Supabase;
- permitir reexecução sem duplicar posts já confirmados;
- estados de execução e de post devem refletir a realidade;
- erros devem ser persistidos com contexto suficiente para retomada.

A execução mensal não deve depender de uma requisição HTTP permanecer aberta durante todo o processo. Pode iniciar uma tarefa assíncrona dentro da própria API, com progresso persistido no banco e consulta pelo frontend.

**Critério de conclusão:** o plano de 150 posts pode ser criado, acompanhado e retomado sem duplicação silenciosa.

### Fase 4 — Facebook Scheduler
**Objetivo:** implementar o agendamento real usando o fluxo já descoberto.

A referência operacional é obrigatoriamente:

`docs/FACEBOOK_SCHEDULING_FLOW.md`

Fluxo mínimo:

1. abrir compositor;
2. inserir texto;
3. inserir link de afiliado;
4. aguardar preview;
5. inserir `@todos` através do autocomplete real do Facebook;
6. clicar `Programar post`;
7. selecionar data;
8. selecionar hora;
9. confirmar `Programar`;
10. navegar/verificar `Posts programados`;
11. somente então marcar o registro como `scheduled`.

Usar seletores semânticos/estáveis sempre que possível e waits baseados em estado/elemento, evitando sleeps cegos.

A automação deve usar a sessão Facebook já existente via Playwright/CDP. Se não houver sessão válida, deve falhar com estado explícito e instrução para login manual, nunca solicitar ou armazenar senha.

**Critério de conclusão:** um post real de teste é agendado e encontrado na lista de posts programados.

### Fase 5 — Validação e limpeza final
**Objetivo:** garantir que a refatoração terminou menor e mais confiável.

Executar:

- build da Web;
- build da API;
- lint;
- testes existentes e novos testes críticos;
- teste do crawler;
- teste de geração NVIDIA;
- teste do plano mensal;
- teste real controlado do Facebook;
- validação de idempotência;
- revisão de variáveis de ambiente;
- revisão de logs e tratamento de erros;
- busca final por `redis`, `ioredis`, `bullmq`, `worker`, `mock`, `fake`, `dummy`, `TODO`, `FIXME` e imports cruzados.

Atualizar este documento com o status de cada fase e registrar decisões relevantes.

**Critério de conclusão:** fluxo ponta a ponta funcional, sem falso positivo de agendamento e sem complexidade desnecessária.

## Ordem de execução

Não executar todas as fases de uma vez.

**Fase 1 → validação → Fase 2 → validação → Fase 3 → validação → Fase 4 → validação → Fase 5.**

Cada fase deve produzir evidência antes de iniciar a seguinte.

## Regra para decisões arquiteturais

Quando houver dúvida entre adicionar uma nova camada ou manter uma implementação simples, escolher a implementação simples. Uma nova infraestrutura só deve ser adicionada quando existir um requisito concreto, mensurável e documentado que a justifique.

## Referências

- `docs/FACEBOOK_SCHEDULING_FLOW.md` — fluxo operacional real do Facebook.
- Commit de referência da documentação do Facebook: `ef48abbc62db6e6c1f3d0dcdd07db1988b180399`.
