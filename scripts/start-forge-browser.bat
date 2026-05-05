@echo off
chcp 65001 >nul

echo =====================================
echo FORGEDEALS CDP BROWSER
echo =====================================
echo.

REM Configurações
set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
set FORGE_DIR=C:\forge-browser
set PROFILE_PATH=%FORGE_DIR%\chrome-profile
set CDP_PORT=9222
set CDP_URL=http://localhost:%CDP_PORT%

REM Verificar se profile clonado existe
if not exist "%PROFILE_PATH%" (
    echo ❌ Profile clonado não encontrado em:
    echo    %PROFILE_PATH%
    echo.
    echo 💡 Execute primeiro: scripts\clone-profile.bat
    pause
    exit /b 1
)

echo 📁 Profile: %PROFILE_PATH%
echo 🔌 Porta CDP: %CDP_PORT%
echo.

REM Verificar se Chrome já está rodando com CDP
echo 🔍 Verificando se CDP já está ativo...
curl -s %CDP_URL%/json/version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ Chrome CDP já está ativo!
    echo.
    goto :success
)

REM Verificar se outro Chrome está rodando
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Outra instância do Chrome detectada
    echo 💡 Apenas o Chrome do ForgeDeals deve estar rodando
    echo.
    choice /C SF /M "S=Parar Chrome e continuar  F=Forçar inicio (pode causar problemas)"
    if errorlevel 2 goto :forcestart
    if errorlevel 1 goto :killchrome
)

goto :startchrome

:killchrome
echo 🛑 Parando instâncias do Chrome...
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 >nul
echo ✅ Chrome parado
echo.

goto :startchrome

:forcestart
echo ⚠️  Iniciando mesmo com Chrome rodando (não recomendado)
echo.

:startchrome
echo 🚀 Iniciando Chrome com CDP...
echo.

REM Argumentos otimizados para automação
start "" "%CHROME_PATH%" ^
--remote-debugging-port=%CDP_PORT% ^
--user-data-dir="%PROFILE_PATH%" ^
--no-first-run ^
--disable-blink-features=AutomationControlled ^
--disable-features=Translate,OptimizationHints,InterestFeedContentSuggestions ^
--disable-component-extensions-with-background-pages ^
--disable-background-networking ^
--disable-sync ^
--disable-default-apps ^
--no-default-browser-check ^
--disable-popup-blocking ^
--disable-gpu ^
--start-maximized ^
--new-window ^
https://www.facebook.com

echo ⏳ Aguardando Chrome iniciar (8 segundos)...
timeout /t 8 >nul

echo 🔍 Verificando CDP...
curl -s %CDP_URL%/json/version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Chrome não respondeu no CDP
    echo 💡 Verifique se o Chrome abriu corretamente
    pause
    exit /b 1
)

echo ✅ Chrome CDP ativo!
echo.

:success
echo =====================================
echo 🎉 FORGEDEALS BROWSER PRONTO
echo =====================================
echo.
echo 📊 Informações:
curl -s %CDP_URL%/json/version | findstr "Browser"
echo.
echo 🔗 CDP Endpoint: %CDP_URL%
echo.
echo 💡 Comandos úteis:
echo    - Testar conexão:  npm run chrome:test
echo    - Abrir dashboard: npm run chrome:dashboard
echo    - Parar Chrome:    taskkill /F /IM chrome.exe
echo.
echo ⚠️  IMPORTANTE: Não feche esta janela do Chrome!
echo.

choice /C CQ /M "C=Continuar usando  Q=Quitar"
if errorlevel 2 exit /b 0
goto :success
