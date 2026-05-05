@echo off
chcp 65001 >nul

echo =====================================
echo FORGEDEALS BROWSER - Setup Completo
echo =====================================
echo.
echo Este script irá:
echo   1. Criar estrutura de diretórios
echo   2. Clonar Profile 1 do Chrome
echo   3. Configurar ambiente ForgeDeals
echo.

set FORGE_DIR=C:\forge-browser
set SOURCE_PROFILE=C:\Users\LG\AppData\Local\Google\Chrome\User Data\Profile 1

echo 📂 Diretório base: %FORGE_DIR%
echo 📁 Profile source: %SOURCE_PROFILE%
echo.

REM Verificar Chrome instalado
if not exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo ❌ Google Chrome não encontrado!
    echo 💡 Instale o Chrome primeiro
    pause
    exit /b 1
)

echo ✅ Chrome encontrado
echo.

REM Verificar Profile 1
if not exist "%SOURCE_PROFILE%" (
    echo ❌ Profile 1 não encontrado!
    echo 💡 Execute Chrome e faça login no Facebook primeiro
    pause
    exit /b 1
)

echo ✅ Profile 1 encontrado
echo.

REM Criar estrutura de diretórios
echo 📦 Criando estrutura de diretórios...

if not exist "%FORGE_DIR%" mkdir "%FORGE_DIR%"
if not exist "%FORGE_DIR%\chrome-profile" mkdir "%FORGE_DIR%\chrome-profile"
if not exist "%FORGE_DIR%\sessions" mkdir "%FORGE_DIR%\sessions"
if not exist "%FORGE_DIR%\screenshots" mkdir "%FORGE_DIR%\screenshots"
if not exist "%FORGE_DIR%\traces" mkdir "%FORGE_DIR%\traces"
if not exist "%FORGE_DIR%\logs" mkdir "%FORGE_DIR%\logs"
if not exist "%FORGE_DIR%\downloads" mkdir "%FORGE_DIR%\downloads"

echo ✅ Diretórios criados
echo.

REM Verificar se Chrome está rodando
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Chrome está em execução
echo.
    choice /C SF /M "S=Fechar Chrome e continuar  F=Cancelar"
    if errorlevel 2 goto :cancel
    if errorlevel 1 goto :killchrome
)
goto :doclone

:killchrome
echo 🛑 Fechando Chrome...
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 3 >nul
echo ✅ Chrome fechado
echo.

:doclone
REM Clonar Profile
echo 📦 Clonando Profile 1 para diretório ForgeDeals...
echo ⏳ Isso pode levar alguns minutos...
echo.

if exist "%FORGE_DIR%\chrome-profile\*" (
    echo 🗑️  Limpando profile antigo...
    rmdir /S /Q "%FORGE_DIR%\chrome-profile"
    mkdir "%FORGE_DIR%\chrome-profile"
)

xcopy "%SOURCE_PROFILE%" "%FORGE_DIR%\chrome-profile" /E /H /C /I /Y /Q

if errorlevel 1 (
    echo ❌ Erro ao clonar profile
    pause
    exit /b 1
)

echo ✅ Profile clonado com sucesso!
echo.

REM Criar arquivo de configuração
echo 📝 Criando arquivo de configuração...
(
echo {
echo   "profilePath": "%FORGE_DIR:\=\\%\\chrome-profile",
echo   "cdpPort": 9222,
echo   "chromePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
echo   "created": "%DATE% %TIME%"
echo }
) > "%FORGE_DIR%\config.json"

echo ✅ Configuração salva
echo.

echo =====================================
echo 🎉 SETUP COMPLETO!
echo =====================================
echo.
echo 📊 Resumo:
echo    Profile: %FORGE_DIR%\chrome-profile
echo    Porta CDP: 9222
echo    Logs: %FORGE_DIR%\logs
echo.
echo 🚀 Próximos passos:
echo    1. Iniciar browser:  scripts\start-forge-browser.bat
echo    2. Testar CDP:     npm run chrome:test
echo    3. Executar app:   npm run dev:workers
echo.

pause
exit /b 0

:cancel
echo ❌ Setup cancelado
echo.
pause
exit /b 1
