# FORGEDEALS AI — SOCIAL CONTENT AGENTS + META CALENDAR SYSTEM
# FACEBOOK GROUP CONTENT OPERATING SYSTEM
# OLLAMA AI EDITORIAL PIPELINE

OBJETIVO:
Criar uma infraestrutura completa de geração automática de conteúdo para Facebook Groups usando agentes IA locais via OLLAMA.

O sistema deve:
- gerar conteúdo diariamente
- organizar calendário visual drag-drop
- manter consistência editorial
- evitar spam
- aumentar engajamento
- manter comportamento humano

-------------------------------------------------------------------------------

# ESTRATÉGIA DE PUBLICAÇÃO

PUBLICAR:
4 posts por dia no grupo principal.

Distribuição fixa:

POST 1:
Vídeo promocional

POST 2:
Oferta produto 1

POST 3:
Post interação/comunidade

POST 4:
Oferta produto 2

-------------------------------------------------------------------------------

# IMPORTANTE

Posts NÃO comerciais:
- SEMPRE incluir discretamente o link afiliado geral
- nunca parecer spam
- inserir naturalmente

LINK AFILIADO GERAL:

https://www.lojadomecanico.com.br/parceiro/0S7w4Sy5S12oCKmeTo3Z3g==?utm_campaign=afiliado-0S7w4Sy5S12oCKmeTo3Z3g==&utm_source=afiliado&utm_medium=site

-------------------------------------------------------------------------------

# ARQUITETURA IA

Criar estrutura:

src/modules/social-ai/

agents/
calendar/
prompts/
templates/
scheduler/
analytics/
dragdrop/
ollama/
personas/
moderation/

-------------------------------------------------------------------------------

# AGENTES IA

Criar múltiplos agentes especializados.

-------------------------------------------------------------------------------

# AGENT 1 — OFFER COPYWRITER

Arquivo:
offerCopy.agent.ts

Responsável:
- gerar ofertas naturais
- criar headlines suaves
- evitar spam
- parecer recomendação humana

Tom:
- técnico
- amigável
- profissional
- sem clickbait

-------------------------------------------------------------------------------

# AGENT 2 — COMMUNITY ENGAGEMENT

Arquivo:
community.agent.ts

Responsável:
- criar perguntas
- criar discussões
- aumentar comentários
- gerar interação real

Tipos:
- enquete
- opinião
- dúvidas técnicas
- comparação marcas
- experiência usuário

-------------------------------------------------------------------------------

# AGENT 3 — VIDEO PROMOTION

Arquivo:
videoPromo.agent.ts

Responsável:
- criar textos para vídeos
- gerar roteiros curtos
- gerar hooks
- gerar legendas

-------------------------------------------------------------------------------

# AGENT 4 — SAFE REWRITER

Arquivo:
safeRewrite.agent.ts

Responsável:
- evitar repetição
- reescrever CTA
- variar estruturas
- humanizar textos

-------------------------------------------------------------------------------

# AGENT 5 — SPAM RISK ANALYZER

Arquivo:
spamAnalyzer.agent.ts

Responsável:
- analisar risco spam
- bloquear conteúdo agressivo
- validar naturalidade

Score:
0-100

-------------------------------------------------------------------------------

# CALENDÁRIO VISUAL

Criar página:

/social-calendar

Inspirado:
- Meta Business Suite
- Notion Calendar
- ClickUp
- Buffer
- Hootsuite

-------------------------------------------------------------------------------

# FUNCIONALIDADES CALENDÁRIO

Implementar:

- calendário mensal
- semanal
- diário
- drag and drop
- reagendamento
- preview Facebook
- status publicação
- fila IA
- filtros
- analytics

-------------------------------------------------------------------------------

# DRAG DROP

Implementar:
react-beautiful-dnd

Permitir:
- mover publicação
- reorganizar horários
- alterar prioridade
- mover entre dias

-------------------------------------------------------------------------------

# VISUAL DOS CARDS

Cada card deve mostrar:

- tipo post
- preview copy
- imagem/vídeo
- score IA
- score spam
- horário
- status
- engajamento previsto

-------------------------------------------------------------------------------

# STATUS POSTS

pending
generated
review
approved
scheduled
published
failed
spam_risk

-------------------------------------------------------------------------------

# ESTRUTURA DIÁRIA FIXA

## MANHÃ — VÍDEO

Horário:
08h-10h

Objetivo:
engajamento leve.

-------------------------------------------------------------------------------

# TARDE — OFERTA 1

Horário:
12h-14h

Objetivo:
CTR.

-------------------------------------------------------------------------------

# FINAL TARDE — INTERAÇÃO

Horário:
16h-18h

Objetivo:
comentários.

-------------------------------------------------------------------------------

# NOITE — OFERTA 2

Horário:
19h-22h

Objetivo:
conversão.

-------------------------------------------------------------------------------

# POSTS DE INTERAÇÃO

IMPORTANTE:
Esses posts NÃO podem parecer vendas.

Exemplos:

- Bosch ou Makita?
- Qual ferramenta você mais usa hoje?
- Melhor compra que já fez na LDM?
- Ferramenta que vale cada centavo?
- Qual furadeira vocês recomendam?

-------------------------------------------------------------------------------

# INSERÇÃO DO LINK AFILIADO

Posts interação:
usar discretamente.

Exemplo:

“Pra quem quiser dar uma olhada nas promoções da loja:
[link afiliado]”

NUNCA:
“COMPRE AGORA”.

-------------------------------------------------------------------------------

# POSTS DE OFERTA

Estrutura:

1. contexto humano
2. observação preço
3. utilidade produto
4. CTA leve

-------------------------------------------------------------------------------

# EXEMPLO BOM

“Essa Bosch apareceu abaixo do preço que costumo acompanhar.

Pra quem estava esperando promoção de parafusadeira 12V, parece boa oportunidade hoje.”

-------------------------------------------------------------------------------

# EXEMPLO RUIM

🔥🔥🔥 IMPERDÍVEL
CORRE COMPRAR
ÚLTIMA CHANCE

-------------------------------------------------------------------------------

# OLLAMA

Criar integração completa.

Arquivo:
ollama.service.ts

Modelos:
llama3
mistral
deepseek
phi

-------------------------------------------------------------------------------

# OLLAMA TASKS

Gerar:
- copy
- perguntas
- CTA suaves
- variações
- títulos
- hooks
- legendas vídeo
- reviews
- comparativos

-------------------------------------------------------------------------------

# PROMPTS IA

Criar:

prompts/

offer.prompt.ts
community.prompt.ts
video.prompt.ts
safeRewrite.prompt.ts
antiSpam.prompt.ts

-------------------------------------------------------------------------------

# REGRAS IA

IA deve evitar:
- caps lock
- excesso emoji
- urgência extrema
- linguagem robótica
- CTA agressivo
- repetição frases

-------------------------------------------------------------------------------

# VARIAÇÃO AUTOMÁTICA

Nunca repetir:
- mesmo CTA
- mesma abertura
- mesmo emoji
- mesmo horário
- mesma estrutura

-------------------------------------------------------------------------------

# ANTI-SPAM

Implementar:

- cooldown 45-90 min
- 1 post grupo por janela
- score spam
- alternância conteúdo
- randomização horários

-------------------------------------------------------------------------------

# ANALYTICS

Mostrar:

- melhor horário
- melhor tipo post
- CTR
- comentários
- engajamento
- copy mais eficiente
- produtos mais clicados

-------------------------------------------------------------------------------

# PUBLICADOR

Criar:

facebookPublisher.ts

Fluxo:

1. abrir grupo
2. preencher textarea
3. upload imagem/vídeo
4. inserir link
5. preview
6. confirmação humana
7. publicar

-------------------------------------------------------------------------------

# HUMANIZAÇÃO

Implementar:

- typing simulation
- delay random
- scroll natural
- mouse movement
- leitura simulada

-------------------------------------------------------------------------------

# STORAGE

Criar tabelas:

social_calendar
social_posts
social_templates
social_analytics
social_queue
social_metrics
engagement_history

-------------------------------------------------------------------------------

# DASHBOARD SOCIAL

Criar central operacional:

/social-command-center

Cards:
- posts hoje
- risco spam
- CTR
- engajamento
- IA ativa
- Ollama status
- fila publicações

-------------------------------------------------------------------------------

# OBJETIVO FINAL

Transformar o ForgeDeals AI em:

- central editorial automatizada
- máquina de conteúdo Facebook-safe
- operação afiliada inteligente
- pipeline social humanizada
- sistema Creator Economy industrial

O sistema deve parecer:
- humano
- natural
- editorial
- técnico
- confiável

NUNCA:
- spam
- flood
- bot agressivo
- catálogo automático