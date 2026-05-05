# FORGEDEALS AI — FACEBOOK SAFE AUTOMATION SYSTEM
# META ANTI-SPAM COMPLIANCE ARCHITECTURE
# OLLAMA LOCAL AI EDITORIAL ENGINE

OBJETIVO PRINCIPAL:
Transformar o ForgeDeals AI em uma plataforma de publicação afiliada inteligente, segura e compatível com padrões comportamentais do Facebook Groups.

O sistema NÃO deve operar como spam automation.

O sistema deve operar como:
- curadoria humana assistida por IA
- pipeline editorial
- observabilidade social
- publicação semi-automatizada
- comportamento humanizado

O foco é:
- segurança operacional
- redução risco shadowban
- evitar comportamento robótico
- aumentar engajamento real
- aumentar CTR orgânico

-------------------------------------------------------------------------------

# ARQUITETURA GERAL

Criar arquitetura modular completa:

src/
  modules/
    social/
      engine/
      scheduler/
      antiSpam/
      templates/
      engagement/
      analytics/
      moderation/
      humanizer/
      facebook/
      queue/
      ai/
      hooks/

-------------------------------------------------------------------------------

# OBJETIVO DO SOCIAL ENGINE

O sistema deve:

1. detectar ofertas relevantes
2. avaliar score oportunidade
3. gerar múltiplas copies naturais
4. validar risco spam
5. alternar formatos
6. agendar horários humanos
7. controlar frequência
8. enviar para fila editorial
9. permitir aprovação manual
10. registrar analytics

-------------------------------------------------------------------------------

# IMPORTANTE

O sistema NÃO deve:
- publicar em massa
- repetir copies
- repetir CTA
- repetir padrões
- parecer bot
- floodar grupos
- postar rapidamente

-------------------------------------------------------------------------------

# CRIAR SISTEMA ANTI-SPAM COMPLETO

Criar módulo:

src/modules/social/antiSpam/

Arquivos:

antiSpam.engine.ts
riskScore.ts
frequencyLimiter.ts
groupCooldown.ts
duplicateDetector.ts
contentVariation.ts
linkPatternDetector.ts
humanBehavior.ts

-------------------------------------------------------------------------------

# REGRAS ANTI-SPAM

Implementar regras reais:

## POSTS POR DIA

safe:
2-4 posts dia

moderado:
5-8

risco:
9+

-------------------------------------------------------------------------------

# COOLDOWN ENTRE POSTS

mínimo:
25 minutos

ideal:
45-90 minutos

nunca permitir:
menos de 15 minutos

-------------------------------------------------------------------------------

# COOLDOWN POR GRUPO

Implementar:
1 post por grupo a cada 24h

modo seguro:
48h

-------------------------------------------------------------------------------

# SCORE DE RISCO SPAM

Criar algoritmo:

fatores:
- repetição texto
- repetição CTA
- repetição emojis
- repetição domínio
- repetição horário
- repetição hashtags
- frequência conta
- quantidade links
- quantidade promoções consecutivas

retorno:
0-100

classificação:
0-30 seguro
31-60 moderado
61-100 risco

-------------------------------------------------------------------------------

# SISTEMA DE VARIAÇÃO AUTOMÁTICA

Criar engine:

contentVariation.ts

Objetivo:
nunca repetir posts iguais.

Gerar:
- múltiplos títulos
- múltiplos CTAs
- múltiplas estruturas
- múltiplos formatos

-------------------------------------------------------------------------------

# FORMATOS DE POSTAGEM

Alternar automaticamente:

TIPO 1:
oferta

TIPO 2:
pergunta

TIPO 3:
review

TIPO 4:
comparativo

TIPO 5:
opinião

TIPO 6:
alerta preço

TIPO 7:
discussão técnica

TIPO 8:
experiência usuário

-------------------------------------------------------------------------------

# EXEMPLOS COPY HUMANIZADA

RUIM:
🔥🔥🔥 IMPERDÍVEL COMPRE AGORA

BOM:
Essa Bosch apareceu abaixo do preço que normalmente acompanho.

Parece boa oportunidade pra quem estava esperando promoção.

-------------------------------------------------------------------------------

# HUMANIZAÇÃO

Criar:
humanizer/

Arquivos:

mouseSimulation.ts
typingSimulation.ts
delayEngine.ts
randomBehavior.ts
sessionVariator.ts

Implementar:
- delays aleatórios
- tempo leitura
- velocidade digitação variável
- pausas humanas
- scroll natural
- movimento mouse gradual

-------------------------------------------------------------------------------

# PLAYWRIGHT SAFE MODE

Criar:

facebookPublisher.ts

Modo:
semi-automatizado

Fluxo:

1. abrir grupo
2. preencher textarea
3. upload imagem
4. adicionar link
5. preview visual
6. aguardar confirmação humana
7. publicar

NUNCA:
publicação totalmente silenciosa inicialmente.

-------------------------------------------------------------------------------

# FILA EDITORIAL

Criar:
queue/

status:
pending
approved
scheduled
published
rejected
spam_risk
cooldown
manual_review

-------------------------------------------------------------------------------

# DASHBOARD SOCIAL

Criar página:

/social-control-center

Inspirado:
- Meta Business Suite
- Datadog
- Hootsuite
- Creator Studio

-------------------------------------------------------------------------------

# COMPONENTES DASHBOARD

## Cards

- posts hoje
- score médio spam
- cooldown grupos
- engajamento médio
- CTR médio
- alcance estimado
- horários mais seguros
- posts rejeitados

-------------------------------------------------------------------------------

# ANALYTICS

Criar:
analytics/

Métricas:
- CTR
- comentários
- likes
- horários
- copy performance
- produtos mais clicados
- marcas mais engajadas
- score conversão

-------------------------------------------------------------------------------

# OLLAMA LOCAL LLM

IMPORTANTE:
O sistema usa OLLAMA.

NÃO usar OpenAI API.

Criar integração completa:

src/modules/social/ai/ollama.service.ts

Modelos:
llama3
mistral
deepseek
phi

-------------------------------------------------------------------------------

# OLLAMA TASKS

Gerar:
- copy Facebook
- variações humanas
- perguntas naturais
- reviews simuladas
- comparativos
- headlines suaves
- CTAs seguros

-------------------------------------------------------------------------------

# PROMPTS IA

Criar:
prompts/

Arquivos:
facebookOffer.prompt.ts
question.prompt.ts
review.prompt.ts
comparison.prompt.ts
safeCTA.prompt.ts

-------------------------------------------------------------------------------

# POLÍTICA DE TEXTO

IA deve evitar:
- excesso emoji
- excesso urgência
- clickbait
- caps lock
- CTA agressivo
- “compre agora”
- “última chance”
- “corre”

-------------------------------------------------------------------------------

# ESTRATÉGIA EDITORIAL

Distribuição automática:

40% ofertas
30% perguntas
20% reviews
10% memes leves/técnico

-------------------------------------------------------------------------------

# AGENDAMENTO INTELIGENTE

scheduler/

Implementar:
- horários aleatórios
- janelas seguras
- evitar padrões fixos
- evitar horários repetidos

-------------------------------------------------------------------------------

# HORÁRIOS PRIORITÁRIOS

prioridade:
08h-10h
12h-14h
18h-22h

-------------------------------------------------------------------------------

# STORAGE

Salvar:

social_posts
social_metrics
spam_logs
engagement_history
group_activity
publication_history

-------------------------------------------------------------------------------

# OBSERVABILIDADE

Criar logs completos:

- publicação iniciada
- cooldown aplicado
- score spam calculado
- IA gerou copy
- grupo selecionado
- atraso aleatório aplicado
- aprovação manual realizada
- publicação concluída

-------------------------------------------------------------------------------

# FAILSAFE

Bloquear automaticamente:

- excesso posts
- repetição conteúdo
- risco spam alto
- grupos repetidos
- flood
- comportamento robótico

-------------------------------------------------------------------------------

# OBJETIVO FINAL

Transformar o ForgeDeals AI em:

- central editorial automatizada
- infraestrutura de mídia afiliada
- sistema social-safe
- pipeline humana assistida por IA
- operação segura para Facebook Groups

O sistema deve priorizar:
- longevidade da conta
- alcance orgânico
- comportamento humano
- engajamento real
- consistência
- segurança operacional

NUNCA priorizar:
- volume agressivo
- spam
- automação massiva
- flood de links
- comportamento robótico