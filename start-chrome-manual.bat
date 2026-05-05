@echo off
echo 🚀 Iniciando Chrome com CDP (modo manual)...
echo.
 
REM Fechar Chrome existente
echo 🔄 Fechando Chrome existente...
taskkill /f /im chrome.exe >nul 2>&1
timeout /t 2 /nobreak >nul
 
REM Iniciar Chrome com CDP
echo 🌐 Iniciando Chrome com remote debugging...
echo Porta: 9222
echo Profile: Profile 1
echo.
 
REM Tentar diferentes métodos de inicialização
 
echo Método 1: Iniciação padrão...
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 1" --new-window https://www.facebook.com
 
echo.
echo ⏳ Aguardando 10 segundos para CDP ativar...
timeout /t 10 /nobreak >nul
 
echo.
echo 🔍 Testando conexão CDP...
curl -s http://localhost:9222/json/version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Chrome CDP ativo em localhost:9222
    echo 📋 Pronto para conectar via Playwright
    echo.
    echo Agora execute: node test-facebook-dynamic.cjs
) else (
    echo ❌ Chrome CDP não responde em localhost:9222
    echo.
    echo 🔍 Diagnóstico:
    echo - Verifique se o firewall não está bloqueando a porta 9222
    echo - Tente executar como administrador
    echo - Verifique se há outro processo usando a porta 9222
    echo.
    echo Tentando método alternativo...
 
    REM Método 2: Com porta diferente
    echo Método 2: Porta 9223...
    taskkill /f /im chrome.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9223 --profile-directory="Profile 1" --new-window https://www.facebook.com
 
    timeout /t 10 /nobreak >nul
 
    curl -s http://localhost:9223/json/version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Chrome CDP ativo em localhost:9223
        echo 📋 Pronto para conectar via Playwright
        echo.
        echo Execute: node test-facebook-dynamic.cjs
    ) else (
        echo ❌ Falha em ambas as portas
        echo 💡 Tente iniciar manualmente:
        echo chrome.exe --remote-debugging-port=9222 --profile-directory="Profile 1"
    )
)
 
echo.
pause