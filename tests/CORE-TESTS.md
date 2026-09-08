# Testes Core - Fluxo de Dinheiro Real

## Ordem de Implementação

1. **CDP Chrome** - Validar conexão ao Chrome real
2. **Facebook Session** - Validar sessão persistida  
3. **Publicação Manual** - Uma publicação real automatizada
4. **Crawler LDM** - Capturar produtos com links de afiliado
5. **Ollama** - Gerar copy útil
6. **Scheduler** - Fila simples de publicação
7. **Anti-Spam Básico** - Limites operacionais
8. **Analytics** - Métricas reais
9. **Fluxo Completo** - End-to-end sem intervenção

---

## Status

| # | Teste | Status | Arquivo |
|---|-------|--------|---------|
| 1 | CDP Chrome | ✅ Implementado | `tests/01-cdp-chrome.test.ts` |
| 2 | Facebook Session | 🔄 Em andamento | `tests/run-tests.ts` (parcial) |
| 3 | Publicação Manual | ⏳ Pendente | - |
| 4 | Crawler LDM | ⏳ Pendente | - |
| 5 | Ollama | ⏳ Pendente | - |
| 6 | Scheduler | ⏳ Pendente | - |
| 7 | Anti-Spam | ⏳ Pendente | - |
| 8 | Analytics | ⏳ Pendente | - |
| 9 | Fluxo Completo | ⏳ Pendente | - |

## Como Executar

```bash
# Todos os testes
npm test

# Teste específico (1 = CDP Chrome)
npm run test:cdp

# Ou diretamente
npx tsx tests/run-tests.ts 1
```

### Pré-requisitos para Teste 1

1. Chrome deve estar rodando com CDP:
   ```bash
   .\start-chrome-manual.bat
   ```

2. Profile 1 deve existir e ter Facebook logado

3. Playwright deve estar instalado:
   ```bash
   npm install -g playwright
   npx playwright install chromium
   ```

---

## Métricas de Sucesso

O objetivo final: **7 dias publicando consistentemente sem bloqueio**

Métricas reais para observar:
- posts_publicados
- posts_falharam  
- ctr
- cliques
- engajamento
- comissões

## Estabilidade Facebook (Crítico)

Observar durante todos os testes:
- checkpoints
- captchas
- bloqueios
- lentidão
- sessão derrubada
