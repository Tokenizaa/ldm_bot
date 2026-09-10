# MISSÃO OPERACIONAL — 150 PRODUTOS → LINKS AFILIADOS → OPEN GRAPH → 150 AGENDAMENTOS FACEBOOK

## Repositório alvo

`Tokenizaa/ldm_bot`

## Objetivo

Executar operacionalmente o ciclo mensal de 150 posts no grupo real **A Loja Do Mecânico** (`792906181765134`) usando o Chrome autenticado via CDP `http://localhost:9222` e o mecanismo nativo **Programar post** do Facebook.

Outro agente pode alterar frontend/backend em paralelo. Este agente não deve corrigir a plataforma.

---

## 1. PRIMEIRO: CAPTURAR OS 150 PRODUTOS

Não iniciar o Facebook antes de consolidar os 150 produtos/posts.

Prioridade de origem:

```text
monthly_plans
  ↓
posts
  ↓
affiliate_link_id
  ↓
affiliate_links
```

Para cada post, obter:

- `post_id`
- `affiliate_link_id`
- produto/ID/SKU quando disponível
- `product_identity_key`
- nome
- marca
- categoria
- `original_url`
- `affiliate_url`
- preço quando disponível
- imagem
- copy existente
- CTA existente
- `scheduled_at`
- grupo

Se o ciclo já possui os 150 produtos, preserve exatamente esses produtos. Não substitua por produtos aleatórios.

Se os dados necessários não estiverem no ciclo, usar os scripts/crawler existentes do projeto para localizar os produtos reais na **Loja do Mecânico**. Não modificar o crawler.

Resultado obrigatório antes de prosseguir:

```text
ESPERADOS: 150
CAPTURADOS: 150
```

Se houver menos de 150, procurar nas fontes existentes. Não inventar nem duplicar produtos.

---

## 2. FLUXO REAL DA LOJA DO MECÂNICO

O crawler existente deve ser tratado como fonte de dados do produto, não como prova de que um URL é afiliado.

O fluxo atual captura páginas de produto `/produto/...` e seus dados. O URL canônico do produto é `original_url`.

**Não assumir que `/produto/...` é `affiliate_url`.**

A Loja do Mecânico disponibiliza o link de afiliado pelo mecanismo de compartilhamento do programa de afiliados. Para cada produto:

```text
abrir produto real
  ↓
usar mecanismo "Compartilhar" da Loja
  ↓
obter o link de afiliado realmente fornecido pela Loja
```

Não inventar parâmetros `affiliate`, `ref`, `partner`, `utm` etc.

Se a Loja gerar URL `/parceiro/...`, preservar o URL exatamente como fornecido.

Nunca aceitar `affiliate_url === original_url` como prova de afiliação.

---

## 3. VALIDAR CADA LINK AFILIADO

Para cada produto:

```text
affiliate_url
  ↓
abrir
  ↓
seguir redirects
  ↓
confirmar página final
  ↓
confirmar que o produto é o mesmo
```

Registrar:

- `original_url`
- `affiliate_url`
- URL final
- cadeia de redirects
- resultado

Se o link não funcionar ou levar ao produto errado, marcar como inválido e não agendar.

---

## 4. VALIDAR OPEN GRAPH

O link afiliado precisa produzir preview correto no Facebook.

Verificar no HTML final:

```html
<meta property="og:title">
<meta property="og:description">
<meta property="og:image">
<meta property="og:url">
```

`og:image` precisa ser imagem real do produto, não placeholder/favicon/imagem genérica.

Registrar por produto:

```text
OG VALID / OG INVALID
```

Não criar proxy, URL intermediária, encurtador ou página própria para forçar Open Graph.

---

## 5. VALIDAR O PREVIEW NO FACEBOOK

Antes dos 150 agendamentos, escolher o primeiro post do ciclo e validar no Facebook real:

```text
Grupo
  ↓
Escreva algo...
  ↓
copy existente
  ↓
affiliate_url real
  ↓
aguardar preview
  ↓
confirmar imagem/título/link
```

Somente considerar o produto pronto quando o preview corresponder ao produto.

---

## 6. CHECKPOINT LOCAL

Criar checkpoint operacional fora do código da aplicação, por exemplo:

`facebook_schedule_execution.json`

Não fazer commit.

Registrar individualmente cada produto/post e seu estado:

```text
captured
affiliate_valid
open_graph_valid
facebook_preview_valid
scheduled
facebook_confirmed
failed
```

Nunca manter somente uma contagem global.

---

## 7. CHROME REAL

Somente depois da preparação dos produtos:

`http://localhost:9222`

Confirmar:

```text
CDP CONNECTED
Facebook autenticado
Grupo acessível
```

Grupo:

**A Loja Do Mecânico**

ID:

`792906181765134`

URL:

`https://www.facebook.com/groups/792906181765134`

Reutilizar o Chrome autenticado existente. Não criar sessão anônima.

Se CDP estiver indisponível, parar e reportar BLOQUEADO. Não substituir por API/mock.

---

## 8. PRIMEIRO AGENDAMENTO REAL

Executar somente um primeiro agendamento, usando o primeiro slot do ciclo:

```text
Dia 1 — 09:00
```

Fluxo:

```text
grupo
↓
Escreva algo...
↓
composer
↓
copy existente
↓
affiliate_url validado
↓
preview correto
↓
Programar post
↓
data correta
↓
09:00
↓
Programar
```

Depois abrir **Posts programados** e confirmar visualmente:

- post encontrado
- produto correto
- data correta
- hora correta
- grupo correto

Capturar evidência.

Só então continuar.

---

## 9. AGENDAR OS OUTROS 149

Calendário:

```text
Dia 1: 09:00, 11:00, 14:00, 17:00, 20:00
Dia 2: 09:00, 11:00, 14:00, 17:00, 20:00
...
Dia 30: 09:00, 11:00, 14:00, 17:00, 20:00
```

Timezone:

`America/Sao_Paulo`

Usar a data/hora local correspondente no Facebook.

Não clicar em **Postar agora**.

O resultado obrigatório é **Posts programados**.

---

## 10. DUPLICIDADE

Antes de cada agendamento:

```text
checkpoint
  ↓
verificar Facebook / Posts programados
  ↓
se já confirmado → NÃO repetir
```

Se a confirmação for ambígua, verificar primeiro no Facebook. Nunca reagendar cegamente.

Não duplicar o mesmo `post_id`.

Não duplicar o mesmo produto apenas mudando a copy.

---

## 11. RECUPERAÇÃO

Erros transitórios podem ter até 3 tentativas controladas:

- timeout
- carregamento incompleto
- elemento temporariamente indisponível
- navegação incompleta

Se houver confirmação ambígua, verificar Facebook antes de nova tentativa.

Se aparecer captcha, checkpoint, bloqueio, limite, sessão expirada, erro de permissão ou mudança inesperada de interface: **parar imediatamente**.

Não contornar mecanismos de segurança do Facebook.

---

## 12. NÃO ALTERAR A PLATAFORMA

Não alterar:

```text
apps/web/
apps/api/
packages/
supabase/
migrations/
.env
FacebookPublisher
services
routes
```

Não corrigir crawler, frontend ou backend durante esta missão.

Não criar endpoint.

Não usar Graph API como substituição do agendamento nativo.

---

## 13. VERIFICAÇÃO FINAL

Ao terminar, abrir **Posts programados** no Facebook e confirmar a quantidade real.

Critério esperado:

```text
150 / 150
```

Também verificar amostras do início, meio e fim do ciclo.

Não considerar sucesso por:

- API 200
- registros no Supabase
- frontend
- checkpoint local
- mock
- ID Facebook sintético

O Facebook real é a confirmação final.

---

## 14. RELATÓRIO FINAL

```text
## RESULTADO

Repositório: Tokenizaa/ldm_bot
Grupo: A Loja Do Mecânico
Group ID: 792906181765134
CDP: CONNECTED / BLOCKED
Facebook: AUTENTICADO / NÃO AUTENTICADO
Produtos encontrados: X/150
Links afiliados válidos: X/150
Open Graph válido: X/150
Previews Facebook válidos: X/150
Posts agendados: X/150
Posts confirmados no Facebook: X/150
Falhas: X
Duplicidades: X
Status: SUCESSO / PARCIAL / BLOQUEADO
```

Para cada falha registrar:

```text
post
produto
original_url
affiliate_url
etapa da falha
erro
último estado conhecido
```

Listar screenshots/evidências produzidos.

---

## CRITÉRIO ABSOLUTO

```text
150 produtos reais
↓
150 links afiliados reais
↓
150 Open Graph válidos
↓
150 previews Facebook válidos
↓
150 agendamentos nativos
↓
150 confirmações em Posts programados
```

Somente então declarar a missão concluída.
