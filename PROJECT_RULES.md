# PROJECT RULES

**Data de Criação**: 2026-05-08  
**Propósito**: Regras obrigatórias para qualquer LLM ou dev que tocar no projeto  
**Status**: VIGENTE E IMUTÁVEL ATÉ NOVA AUDITORIA

---

## REGRAS FUNDAMENTAIS

### 1. NÃO ADICIONAR NOVAS ARQUITETURAS

**PROIBIDO:**
- Criar microserviços
- Implementar arquitetura enterprise
- Adicionar patterns complexos sem necessidade operacional
- Criar abstrações por antecipação

**PERMITIDO:**
- Manter arquitetura atual simples
- Adicionar código apenas para resolver problema real
- Reutilizar patterns existentes

### 2. NÃO CRIAR ABSTRAÇÕES SEM USO REAL

**PROIBIDO:**
- Factories sem múltiplas implementações
- Managers sem múltiplos recursos
- Interfaces sem implementações concretas
- Abstract classes sem herança real

**PERMITIDO:**
- Abstrações com 2+ implementações ativas
- Interfaces para testes reais
- Classes base com funcionalidade compartilhada

### 3. NÃO ADICIONAR MICROSERVIÇOS

**PROIBIDO:**
- Separar API em múltiplos serviços
- Criar workers distribuídos
- Implementar service mesh
- Adicionar orquestradores

**PERMITIDO:**
- Manter monolito workers
- Usar filas apenas se necessário operacional
- Manter API simples (se implementada)

### 4. NÃO ADICIONAR REDIS/BULLMQ ATIVO SEM NECESSIDADE

**PROIBIDO:**
- Ativar Redis sem jobs reais
- Implementar BullMQ sem processamento real
- Criar filas "para o futuro"
- Adicionar complexidade de fila para tarefas síncronas

**PERMITIDO:**
- Manter configuração existente (inativa)
- Ativar apenas quando houver jobs reais processando
- Usar para tarefas assíncronas genuínas

### 5. NÃO CRIAR APIS/WEBAPPS PARALELOS

**PROIBIDO:**
- Criar nova API sem necessidade real
- Implementar frontend sem backend funcional
- Adicionar dashboards sem dados reais
- Criar interfaces admin sem features reais

**PERMITIDO:**
- Manter apps existentes (inativos)
- Completar apenas se necessário operacional
- Usar para visualizar dados existentes

---

## REGRAS DE DESENVOLVIMENTO

### 6. SEMPRE REUTILIZAR CÓDIGO EXISTENTE

**OBRIGATÓRIO:**
- Verificar código existente antes de criar novo
- Reutilizar serviços existentes
- Estender classes existentes vs criar novas
- Usar patterns já estabelecidos

**VERIFICAÇÃO:**
- Buscar por implementações similares
- Verificar se serviço já existe
- Revisar `PROJECT_STATE_FREEZE.md`

### 7. FACEBOOK PUBLISHER DEVE SER SIMPLES E DIRETO

**REGRAS:**
- Sem orquestração complexa
- Sem múltiplos formatos de post
- Sem agendamento inteligente inicialmente
- Sem processamento de imagem avançado

**IMPLEMENTAÇÃO:**
- Texto simples + imagem
- 1 grupo por vez
- Post direto sem workflow complexo

### 8. ESCOPO OPERACIONAL LIMITADO

**GRUPO FACEBOOK:**
- Máximo 1 grupo inicialmente
- "A Loja Do Mecânico" como target

**FREQUÊNCIA:**
- Máximo 4 posts por dia
- Sem spam ou excesso

**PRODUTOS:**
- Foco em Loja do Mecânico
- Sem múltiplos e-commerces inicialmente

---

## REGRAS DE PRIORIDADE

### 9. PRIORIZAR ESTABILIDADE > ESCALABILIDADE

**ESTABILIDADE:**
- Código deve funcionar consistentemente
- Sem crashes ou memory leaks
- Tratamento de erros robusto
- Logs claros para debug

**ESCALABILIDADE:**
- Apenas se estabilidade garantida
- Sem otimização prematura
- Sem complexidade para "futuro"

### 10. PRIORIZAR SIMPLICIDADE > ELEGÂNCIA ARQUITETURAL

**SIMPLICIDADE:**
- Código linear e direto
- Mínimo de indireção
- Fácil de entender e debugar
- Funciona primeiro

**ELEGÂNCIA:**
- Apenas se não comprometer simplicidade
- Sem patterns por academicismo
- Sem over-engineering

---

## REGRAS DE FEATURES

### 11. QUALQUER FEATURE NOVA DEVE JUSTIFICAR NECESSIDADE OPERACIONAL REAL

**PERGUNTAS OBRIGATÓRIAS:**
- Qual problema real resolve?
- Já existe solução alternativa?
- É necessário para operação atual?
- Pode ser implementado de forma simples?

**DOCUMENTAÇÃO:**
- Criar issue descrevendo necessidade
- Justificar com caso de uso real
- Aguardar aprovação explícita

### 12. CÓDIGO MORTO DEVE SER REMOVIDO APÓS AUDITORIA

**PROCESSO:**
- Identificar código não utilizado
- Verificar se há referências ativas
- Remover após confirmação
- Atualizar documentação

**EXCEÇÕES:**
- Código em uso (mesmo que raro)
- Código com planos concretos de uso
- Código de referência/histórico

---

## REGRAS DE WORKFLOW

### 13. TUDO DEVE FUNCIONAR PRIMEIRO LOCALMENTE VIA CDP

**OBRIGATÓRIO:**
- Testar com Chrome CDP local
- Verificar Profile 1 funcionando
- Validar sessões manualmente
- Funcionar sem infraestrutura externa

**PASSOS:**
1. `npm run chrome:legacy`
2. `npm run test:cdp`
3. Testar feature manualmente
4. Somente depois automatizar

### 14. NÃO ASSUMIR INFRAESTURA ATIVA

**VERIFICAÇÕES:**
- Redis está rodando?
- Supabase está acessível?
- Chrome CDP está ativo?
- Profile 1 existe?

**FALHAS GRACEFUL:**
- Tratar ausência de infra
- Fallback para modo local
- Logs claros do que falta

### 15. MANTER COMPATIBILIDADE COM ESTADO ATUAL

**REGRAS:**
- Não quebrar fluxos existentes
- Manter contracts atuais
- Preservar configurações
- Evitar breaking changes

---

## REGRAS DE QUALIDADE

### 16. MEMORY LEAKS SÃO CRÍTICOS

**OBRIGATÓRIO:**
- Sempre fazer cleanup em finally blocks
- Fechar páginas criadas
- Limpar event listeners
- Monitorar recursos

**PADRÃO:**
```typescript
try {
  // código
} finally {
  if (page) await page.close();
  // outros cleanups
}
```

### 17. SELECTORES SÃO FRÁGEIS - TRATAR COMO TAL

**REGRAS:**
- Sempre usar try/catch em seletores
- Múltiplos seletores fallback
- Timeout razoável
- Logs de falha de seletores

### 18. CREDENCIAIS SÃO SENSÍVEIS

**REGRAS:**
- Nunca hardcoded
- Sempre em environment variables
- Validar presença no startup
- Mensagens claras de erro

---

## REGRAS DE DOCUMENTAÇÃO

### 19. MANTER PROJECT_STATE_FREEZE.md ATUALIZADO

**OBRIGATÓRIO:**
- Atualizar após mudanças estruturais
- Manter sincronia com realidade
- Não documentar features não implementadas
- Remover referências obsoletas

### 20. NÃO CRIAR DOCUMENTAÇÃO ENGANOSA

**PROIBIDO:**
- Documentar features que não existem
- Descrever arquitetura não implementada
- Prometer funcionalidades futuras
- Ocultar limitações reais

---

## REGRAS DE TESTES

### 21. TESTES DEVEM REFLETIR REALIDADE OPERACIONAL

**FOCO:**
- Testar fluxos reais
- Usar dados reais (quando possível)
- Simular ambiente real
- Testar casos de falha

### 22. NÃO TESTAR O ÓBVIO

**EVITAR:**
- Testes de getters/setters
- Testes de código trivial
- Testes que não adicionam valor
- Testes que sempre passam

---

## REGRAS DE DEPLOY

### 23. DEPLOY SÓ SE FUNCIONAR LOCALMENTE

**REQUISITOS:**
- Todos testes passando localmente
- Fluxo completo funcionando
- Sem erros de console
- Performance aceitável

### 24. DEPLOY INCREMENTAL

**PROCESSO:**
- Mudanças pequenas
- Validação pós-deploy
- Rollback fácil
- Monitoramento ativo

---

## REGRAS DE VIOLAÇÃO

### 25. VIOLAÇÕES DEVEM SER JUSTIFICADAS

**PROCESSO:**
- Documentar motivo da violação
- Explicar por que regra não se aplica
- Propor revisão futura
- Obter aprovação explícita

### 26. REGRAS PODEM SER ATUALIZADAS

**PROCESSO:**
- Discutir mudança
- Atualizar documento
- Comunicar time
- Manter histórico

---

## CHECKLIST DE DESENVOLVIMENTO

### ANTES DE CODAR:
- [ ] Li PROJECT_STATE_FREEZE.md
- [ ] Verifiquei código existente
- [ ] Justifiquei necessidade real
- [ ] Confirmei escopo permitido

### DURANTE CODAR:
- [ ] Reutilizando código existente
- [ ] Mantendo simplicidade
- [ ] Tratando errors adequadamente
- [ ] Evitando memory leaks

### APÓS CODAR:
- [ ] Testei localmente via CDP
- [ ] Verifiquei compatibilidade
- [ ] Atualizei documentação
- [ ] Removi código morto

---

## CONSEQUÊNCIAS

### VIOLAÇÃO SEM JUSTIFICATIVA:
- Revertido imediatamente
- Code review obrigatório
- Documentação de lições aprendidas

### VIOLAÇÃO COM JUSTIFICATIVA:
- Aprovada por lead técnico
- Documentada em PROJECT_RULES.md
- Revisada em próxima auditoria

---

**ESTE DOCUMENTO É VINCULANTE E DEVE SER SEGUIDO RIGIDOSAMENTE**  
**QUALQUER DESVIO REQUER JUSTIFICATIVA EXPLÍCITA E APROVAÇÃO**
