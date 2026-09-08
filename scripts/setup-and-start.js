#!/usr/bin/env node
/**
 * Setup e inicialização do Forge Browser
 * Usa Node.js para evitar problemas de codificação dos .bat
 */

import { spawn, exec } from 'child_process';
import { mkdirSync, existsSync, copyFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const FORGE_DIR = 'C:\\forge-browser';
const SOURCE_PROFILE = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message) {
  console.log(message);
}

async function checkChromeRunning() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq chrome.exe" /FO CSV');
    return stdout.includes('chrome.exe');
  } catch {
    return false;
  }
}

async function killChrome() {
  try {
    await execAsync('taskkill /F /IM chrome.exe');
    log('Chrome fechado');
    await sleep(3000);
  } catch {
    // Chrome não estava rodando
  }
}

function copyDirRecursive(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      try {
        copyFileSync(srcPath, destPath);
      } catch (err) {
        // Ignora arquivos bloqueados
      }
    }
  }
}

async function setup() {
  log('=====================================');
  log('FORGEDEALS BROWSER SETUP');
  log('=====================================\n');

  // Verificar Chrome
  if (!existsSync(CHROME_PATH)) {
    log('❌ Chrome não encontrado!');
    process.exit(1);
  }
  log('✅ Chrome encontrado');

  // Verificar Profile 1
  if (!existsSync(SOURCE_PROFILE)) {
    log('❌ Profile 1 não encontrado!');
    log('   Faça login no Chrome primeiro');
    process.exit(1);
  }
  log('✅ Profile 1 encontrado');

  // Fechar Chrome
  const isRunning = await checkChromeRunning();
  if (isRunning) {
    log('\n⚠️  Chrome está rodando. Fechando...');
    await killChrome();
  }

  // Criar diretórios
  log('\n📂 Criando estrutura de diretórios...');
  const dirs = [
    FORGE_DIR,
    join(FORGE_DIR, 'chrome-profile'),
    join(FORGE_DIR, 'sessions'),
    join(FORGE_DIR, 'screenshots'),
    join(FORGE_DIR, 'traces'),
    join(FORGE_DIR, 'logs'),
    join(FORGE_DIR, 'downloads')
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
  log('✅ Diretórios criados');

  // Clonar profile
  log('\n📦 Clonando Profile 1 (isso pode levar alguns minutos)...');
  const destProfile = join(FORGE_DIR, 'chrome-profile');
  
  // Remover profile antigo se existir
  if (existsSync(destProfile) && readdirSync(destProfile).length > 0) {
    log('   Removendo profile antigo...');
    try {
      await execAsync(`rmdir /S /Q "${destProfile}"`);
      mkdirSync(destProfile, { recursive: true });
    } catch {
      // Ignora erro
    }
  }

  // Copiar arquivos
  log('   Copiando arquivos...');
  copyDirRecursive(SOURCE_PROFILE, destProfile);
  log('✅ Profile clonado');

  // Criar config
  const config = {
    profilePath: destProfile,
    cdpPort: 9222,
    chromePath: CHROME_PATH,
    created: new Date().toISOString()
  };
  writeFileSync(
    join(FORGE_DIR, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  log('✅ Configuração salva');

  log('\n=====================================');
  log('✅ SETUP COMPLETO!');
  log('=====================================\n');
  log('Execute agora: npm run chrome:start');
  log('   ou: node scripts/setup-and-start.js start\n');
}

async function startChrome() {
  log('=====================================');
  log('FORGEDEALS BROWSER START');
  log('=====================================\n');

  const profilePath = join(FORGE_DIR, 'chrome-profile');

  if (!existsSync(profilePath)) {
    log('❌ Profile não encontrado. Execute setup primeiro:');
    log('   node scripts/setup-and-start.js setup\n');
    process.exit(1);
  }

  // Verificar CDP
  try {
    const response = await fetch('http://localhost:9222/json/version');
    if (response.ok) {
      log('✅ Chrome CDP já está rodando!');
      const data = await response.json();
      log(`   Browser: ${data.Browser}`);
      return;
    }
  } catch {
    // Não está rodando
  }

  // Fechar outras instâncias
  await killChrome();

  // Iniciar Chrome
  log('🚀 Iniciando Chrome com CDP...');
  log(`   Profile: ${profilePath}`);
  log(`   Porta: 9222\n`);

  const args = [
    '--remote-debugging-port=9222',
    `--user-data-dir=${profilePath}`,
    '--no-first-run',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=Translate,OptimizationHints,InterestFeedContentSuggestions',
    '--disable-component-extensions-with-background-pages',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-default-apps',
    '--no-default-browser-check',
    '--disable-popup-blocking',
    '--disable-gpu',
    '--start-maximized',
    '--new-window',
    'https://www.facebook.com'
  ];

  const chrome = spawn(CHROME_PATH, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });

  log(`   PID: ${chrome.pid}`);
  log('\n⏳ Aguardando Chrome iniciar...');

  // Aguardar CDP
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    attempts++;
    await sleep(2000);

    try {
      const response = await fetch('http://localhost:9222/json/version');
      if (response.ok) {
        const data = await response.json();
        log('\n✅ Chrome CDP ATIVO!');
        log(`   Browser: ${data.Browser}`);
        log(`   Protocolo: ${data['Protocol-Version']}`);
        log('\n🎉 PRONTO PARA USAR!');
        log('   CDP: http://localhost:9222');
        log('   Teste: npm run chrome:test\n');
        return;
      }
    } catch {
      log(`   Tentativa ${attempts}/${maxAttempts}...`);
    }
  }

  log('\n❌ Timeout aguardando Chrome CDP');
  process.exit(1);
}

// Main
const command = process.argv[2];

if (command === 'setup') {
  setup().catch(err => {
    log(`❌ Erro: ${err.message}`);
    process.exit(1);
  });
} else if (command === 'start') {
  startChrome().catch(err => {
    log(`❌ Erro: ${err.message}`);
    process.exit(1);
  });
} else {
  // Setup + Start automático
  (async () => {
    const profilePath = join(FORGE_DIR, 'chrome-profile');
    if (!existsSync(profilePath) || readdirSync(profilePath).length === 0) {
      log('📦 Primeira execução - executando setup...\n');
      await setup();
      log('\n🚀 Iniciando Chrome...\n');
    }
    await startChrome();
  })().catch(err => {
    log(`❌ Erro: ${err.message}`);
    process.exit(1);
  });
}
