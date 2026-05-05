# TESTE 1: CDP Chrome Connection

## Objetivo

Validar que o worker controla o Chrome REAL via CDP (Chrome DevTools Protocol).

## Checklist de Validação

- [ ] Chrome aberto com `--remote-debugging-port=9222`
- [ ] Playwright conecta via `connectOverCDP()`
- [ ] Usa Profile 1 correto (`Profile 1`)
- [ ] Facebook já logado (sessão detectada)
- [ ] Não fecha outras instâncias
- [ ] Não cria navegador temporário

## Resultado Esperado

```
✅ CDP CONNECTED
Facebook session detected
Profile 1 active
```

## Como Executar

### 1. Iniciar Chrome com CDP

```bash
.\start-chrome-manual.bat
```

Ou manualmente:
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --profile-directory="Profile 1"
```

### 2. Verificar se Chrome responde

```bash
curl http://127.0.0.1:9222/json/version
```

Deve retornar algo como:
```json
{
  "Browser": "Chrome/135.0.0.0",
  "Protocol-Version": "1.3"
}
```

### 3. Executar teste

```bash
npm run test:cdp
```

## O que o teste faz

1. **Verifica Profile 1** existe no disco
2. **Verifica Chrome CDP** na porta 9222
3. **Conecta Playwright** via `connectOverCDP()`
4. **Detecta abas** e contextos abertos
5. **Procura Facebook** nas abas abertas
6. **Valida sessão** ativa (navegação visível)
7. **Desconecta** sem fechar Chrome

## Possíveis Falhas

| Falha | Causa | Solução |
|-------|-------|---------|
| Profile 1 não encontrado | Path diferente | Verificar `AppData/Local/Google/Chrome/User Data/Profile 1` |
| Chrome CDP não responde | Porta ocupada | Fechar outros Chromes, usar porta diferente |
| Playwright não conecta | Versão incompatível | Atualizar: `npm install playwright@latest` |
| Facebook não detectado | Aba fechada | Abrir facebook.com no Chrome antes |
| Sessão expirada | Cookie expirado | Refazer login no Chrome manualmente |

## Próximo Passo

Após passar no Teste 1, vá para:
- **Teste 2**: Facebook Session (validar persistência)
- **Teste 3**: Publicação Manual (fazer uma publicação real)
