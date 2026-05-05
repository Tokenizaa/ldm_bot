@echo off
chcp 65001 >nul

echo =====================================
echo FORGEDEALS - Clone Profile 1
echo =====================================
echo.

set SOURCE_PROFILE=C:\Users\LG\AppData\Local\Google\Chrome\User Data\Profile 1
set DEST_DIR=C:\forge-browser
set DEST_PROFILE=%DEST_DIR%\chrome-profile

REM Verificar se Profile 1 existe
if not exist "%SOURCE_PROFILE%" (
    echo ❌ Profile 1 não encontrado em:
    echo    %SOURCE_PROFILE%
    echo.
    echo 💡 Execute Chrome normalmente e faça login no Facebook primeiro
    pause
    exit /b 1
)

echo 📁 Profile 1 encontrado
echo    Source: %SOURCE_PROFILE%
echo    Dest:   %DEST_PROFILE%
echo.

REM Criar diretório de destino se não existir
if not exist "%DEST_DIR%" (
    echo 📂 Criando diretório %DEST_DIR%...
    mkdir "%DEST_DIR%"
)

REM Criar subdiretórios
if not exist "%DEST_DIR%\sessions" mkdir "%DEST_DIR%\sessions"
if not exist "%DEST_DIR%\screenshots" mkdir "%DEST_DIR%\screenshots"
if not exist "%DEST_DIR%\traces" mkdir "%DEST_DIR%\traces"
if not exist "%DEST_DIR%\logs" mkdir "%DEST_DIR%\logs"

REM Verificar se Chrome está rodando
echo 🔍 Verificando se Chrome está rodando...
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Chrome está em execução!
    echo 💡 Feche todas as janelas do Chrome antes de clonar
    echo.
    choice /C SN /M "Deseja forçar fechamento do Chrome?"
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

doclone:
REM Remover profile antigo se existir
if exist "%DEST_PROFILE%" (
    echo 🗑️  Removendo profile antigo...
    rmdir /S /Q "%DEST_PROFILE%"
    echo ✅ Profile antigo removido
    echo.
)

REM Clonar Profile 1
echo 📦 Clonando Profile 1 (pode levar alguns minutos)...
echo ⏳ Copiando arquivos...

xcopy "%SOURCE_PROFILE%" "%DEST_PROFILE%" /E /H /C /I /Y /Q

if errorlevel 1 (
    echo ❌ Erro ao clonar profile
    pause
    exit /b 1
)

echo ✅ Profile clonado com sucesso!
echo.
echo 📊 Resumo:
echo    Diretório: %DEST_PROFILE%
echo    Tamanho: 
for /f "tokens=3" %%a in ('dir /-c "%DEST_PROFILE%" ^| findstr "bytes"') do echo      %%a bytes
echo.

echo 🎉 Pronto para usar!
echo 💡 Execute agora: npm run chrome:start
echo.

pause
exit /b 0

:cancel
echo ❌ Operação cancelada pelo usuário
pause
exit /b 1
