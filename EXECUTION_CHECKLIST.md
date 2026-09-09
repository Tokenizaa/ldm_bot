# CHECKLIST DE EXECUÇÃO - FORGEDEALS BOT

**Data**: 2026-05-08  
**Status**: PRONTO PARA USO  
**Versão**: 1.0.0 Simplificada

---

## PRÉ-REQUISITOS

### Sistema Operacional
- [ ] **Windows 10/11** (obrigatório para Chrome Profile)
- [ ] **Node.js 18+** instalado
- [ ] **Git** para controle de versão

### Chrome Browser
- [ ] **Google Chrome** instalado
- [ ] **Profile 1** criado e logado no Facebook
- [ ] **Sessão Facebook ativa** (não expirou)

### Serviços Externos
- [ ] **Ollama** rodando em `localhost:11434`
- [ ] **Modelo Llama3** baixado (`ollama pull llama3:8b`)
- [ ] **Projeto Supabase** criado
- [ ] **Tabelas criadas** (executar `supabase-migration.sql`)

---

## CONFIGURAÇÃO INICIAL

### 1. Clonar Projeto
```bash
git clone <repositório>
cd ldm_bot
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais:
```

**Variáveis Obrigatórias:**
```bash
# Chrome CDP
CHROME_USER_DATA_DIR=C:\Users\LG\AppData\Local\Google\Chrome\User Data
CHROME_PROFILE_DIRECTORY=Profile 1

# Loja do Mecânico
LOJA_DO_MECANICO_EMAIL=seu@email.com
LOJA_DO_MECANICO_PASSWORD=sua_senha

# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anon

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3:8b
```

### 4. Configurar Supabase
```bash
# Executar schema no Supabase SQL Editor
# Ou usar CLI: supabase db push supabase-migration.sql
```

---

## CHECKLIST DE EXECUÇÃO

### PASSO 1: VERIFICAR AMBIENTE
- [ ] **Node.js versão** >= 18 (`node --version`)
- [ ] **Dependências instaladas** (`npm list`)
- [ ] **Variáveis configuradas** (`cat .env`)
- [ ] **Chrome Profile 1 existe** (verificar pasta)
- [ ] **Ollama respondendo** (`curl http://localhost:11434/api/tags`)
- [ ] **Supabase conectando** (testar URL/chave)

### PASSO 2: INICIAR CHROME CDP
```bash
npm run chrome:start
```

**Verificar:**
- [ ] Chrome abre com Profile 1
- [ ] Facebook já está logado
- [ ] Porta 9222 está ativa
- [ ] CDP acessível (`curl http://127.0.0.1:9222/json/version`)

### PASSO 3: TESTAR CONEXÃO
```bash
npm run test:cdp
```

**Verificar:**
- [ ] Teste CDP passa
- [ ] Conexão Chrome estabelecida
- [ ] Sessão Facebook validada

### PASSO 4: EXECUTAR BOT COMPLETO
```bash
npm start
```

**Monitorar:**
- [ ] Bot inicia sem erros
- [ ] Chrome CDP conecta
- [ ] Sessão Facebook validada
- [ ] Login Loja do Mecânico sucesso
- [ ] Produtos extraídos
- [ ] Ollama gera copy
- [ ] Dados salvos no Supabase
- [ ] Post publicado no Facebook
- [ ] Status atualizado
- [ ] Bot finaliza com sucesso

---

## VALIDAÇÃO PÓS-EXECUÇÃO

### Verificar Logs
```bash
# Logs devem mostrar:
✅ Ambiente carregado
✅ Chrome CDP conectado
✅ Sessão Facebook validada
✅ Produtos extraídos
✅ Copy gerada
✅ Dados salvos
✅ Post publicado
🎉 Bot ForgeDeals executado com sucesso!
```

### Verificar Supabase
- [ ] **Produto salvo** na tabela `products`
- [ ] **Post criado** na tabela `posts`
- [ ] **Status = 'posted'** atualizado
- [ ] **Facebook Post ID** preenchido

### Verificar Facebook
- [ ] **Post visível** no grupo "A Loja Do Mecânico"
- [ ] **Conteúdo correto** (copy + link)
- [ ] **Formato adequado** (sem quebras)

---

## TROUBLESHOOTING

### Chrome CDP Não Conecta
**Sintomas:**
- Erro "CDP connection failed"
- Timeout na conexão

**Soluções:**
- [ ] Verificar se Chrome está rodando
- [ ] Confirmar porta 9222 livre
- [ ] Restartar Chrome CDP
- [ ] Verificar Profile 1 existe

### Facebook Session Inválida
**Sintomas:**
- Erro "Sessão Facebook não está ativa"
- Login expirado

**Soluções:**
- [ ] Fazer login manual no Chrome
- [ ] Verificar 2FA não ativada
- [ ] Limpar cookies e relogar
- [ ] Usar Profile diferente

### Loja do Mecânico Falha Login
**Sintomas:**
- Erro "Falha no login Loja do Mecânico"
- Credenciais rejeitadas

**Soluções:**
- [ ] Verificar email/senha corretos
- [ ] Verificar conta não bloqueada
- [ ] Tentar login manual primeiro
- [ ] Verificar CAPTCHA

### Ollama Não Responde
**Sintomas:**
- Erro "OLLAMA HTTP 500"
- Timeout na geração

**Soluções:**
- [ ] Verificar Ollama rodando
- [ ] Confirmar modelo baixado
- [ ] Testar API diretamente
- [ ] Restartar Ollama

### Supabase Connection Error
**Sintomas:**
- Erro "Invalid Supabase credentials"
- Falha ao salvar dados

**Soluções:**
- [ ] Verificar URL/chave corretos
- [ ] Confirmar projeto ativo
- [ ] Testar conexão manual
- [ ] Verificar RLS policies

---

## PERFORMANCE E MONITORING

### Tempos Esperados
- **Startup**: 3-5 segundos
- **Chrome CDP**: 2-3 segundos
- **Facebook validation**: 5-10 segundos
- **Loja login**: 10-15 segundos
- **Product extraction**: 30-60 segundos
- **Ollama generation**: 5-10 segundos
- **Facebook posting**: 10-20 segundos
- **Total execution**: 60-120 segundos

### Memory Usage
- **Normal**: 100-200MB
- **Alerta**: >300MB
- **Crítico**: >500MB

### Logs Importantes
```bash
# Sucesso
🎉 Bot ForgeDeals executado com sucesso!

# Erros críticos
❌ Falha na execução do bot ForgeDeals
💥 Erro fatal na execução
```

---

## MANUTENÇÃO

### Diária
- [ ] Verificar logs de execução
- [ ] Confirmar posts publicados
- [ ] Validar sessões ativas

### Semanal
- [ ] Limpar logs antigos
- [ ] Verificar memory usage
- [ ] Atualizar dependências

### Mensal
- [ ] Rotacionar credenciais se necessário
- [ ] Backup banco Supabase
- [ ] Revisar performance

---

## SEGURANÇA

### Credenciais
- [ ] **NUNCA** commitar `.env`
- [ ] Usar variáveis de ambiente
- [ ] Rotacionar senhas periodicamente
- [ ] Usar senhas fortes

### Facebook
- [ ] Evitar posts excessivos
- [ ] Respeitar limites da plataforma
- [ ] Não usar contas recém-criadas
- [ ] Monitorar sinais de bloqueio

### Dados
- [ ] Backup regular Supabase
- [ ] Não coletar dados PII desnecessários
- [ ] Respeitar LGPD/GDPR

---

## ESCALA E LIMITES

### Limites Atuais
- **Posts por dia**: Máximo 4
- **Grupos**: 1 apenas ("A Loja Do Mecânico")
- **Produtos por execução**: 10 máximos
- **Concorrência**: Single process

### Quando Aumentar
- **Múltiplos grupos**: Apenas após validação
- **Mais posts**: Avaliar engajamento
- **Concorrência**: Adicionar rate limiting
- **Escalabilidade**: Considerar arquitetura distribuída

---

## CHECKLIST FINAL

### Antes de Ir para Produção
- [ ] **Todos os testes passando**
- [ ] **Credenciais configuradas**
- [ ] **Serviços externos ativos**
- [ ] **Performance aceitável**
- [ ] **Logs funcionando**
- [ ] **Backup configurado**
- [ ] **Monitoramento ativo**
- [ ] **Documentação atualizada**

### Go/No-Go Decision
**GO** se:
- ✅ Todos os itens acima marcados
- ✅ Testes executados com sucesso
- ✅ Performance dentro dos limites
- ✅ Sem erros críticos

**NO-GO** se:
- ❌ Erros de conexão persistentes
- ❌ Credenciais inválidas
- ❌ Serviços externos indisponíveis
- ❌ Performance inadequada

---

## CONTATO E SUPORTE

### Problemas Comuns
- **Chrome CDP**: Verificar Profile 1
- **Facebook**: Validar sessão manualmente
- **Ollama**: Confirmar serviço rodando
- **Supabase**: Testar conexão direta

### Debug Tips
```bash
# Verificar Chrome
netstat -an | findstr 9222

# Testar Ollama
curl http://localhost:11434/api/tags

# Verificar variáveis
echo $SUPABASE_URL
```

---

## CONCLUSÃO

**Status**: **BOT PRONTO PARA OPERAÇÃO** 🚀

Com este checklist, o ForgeDeals Bot está pronto para execução produtiva com:
- ✅ Setup simplificado
- ✅ Fluxo validado
- ✅ Monitoramento ativo
- ✅ Troubleshooting documentado
- ✅ Segurança implementada

**Próximo passo**: Executar primeira vez em produção e validar resultado.

---

*"A simplicidade é a sofisticação máxima." - Leonardo da Vinci*
