@echo off
echo 🚀 Iniciando ForgeDeals - Modo Simplificado
echo.

REM Verificar variáveis de ambiente
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado!
    echo 💡 Copie .env.example para .env e configure suas credenciais
    pause
    exit /b 1
)

REM Iniciar Chrome CDP se necessário
echo 🔍 Verificando Chrome CDP...
curl -s http://localhost:9222/json/version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🌐 Iniciando Chrome com CDP...
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="./browser-data" --no-first-run
    echo ⏳ Aguardando 5 segundos...
    timeout /t 5 /nobreak >nul
)

REM Iniciar aplicação
echo 📱 Iniciando aplicação...
npm run dev

echo.
echo ✅ ForgeDeals iniciado com sucesso!
echo 💡 Acesse: http://localhost:5173
echo 🎯 Configure tudo no painel operacional
