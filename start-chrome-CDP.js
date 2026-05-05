#!/usr/bin/env node
/**
 * Inicia Chrome com CDP e Profile 1 logado
 * Garante que a sessão do Facebook seja mantida
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const PROFILE_PATH = join(USER_DATA_DIR, 'Profile 1');
const CDP_PORT = 9222;
const CDP_URL = `http://127.0.0.1:${CDP_PORT}`;

console.log('🚀 Chrome CDP + Profile 1 Logado\n');

// 1. Verificar Profile 1 existe
console.log('📁 Verificando Profile 1...');
if (!existsSync(PROFILE_PATH)) {
  console.error(`❌ Profile 1 não encontrado em:`);
  console.error(`   ${PROFILE_PATH}`);
  console.error(`\n💡 Solução: Faça login no Chrome normalmente primeiro`);
  process.exit(1);
}
console.log(`   ✅ Profile 1 encontrado`);
console.log(`   📂 Path: ${PROFILE_PATH}`);

// 2. Matar TODOS os processos Chrome (incluindo background apps)
console.log('\n🔄 Fechando todas as instâncias Chrome...');
try {
  // Mata chrome.exe de forma agressiva
  execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
  execSync('taskkill /F /IM chrome.exe /FI "STATUS eq RUNNING"', { stdio: 'ignore' });
} catch {
  // Ignora erro se não houver processos
}

// Aguarda processos terminarem
console.log('   ⏳ Aguardando 3 segundos...');
await new Promise(r => setTimeout(r, 3000));

// 3. Verificar se portas estão livres
console.log('\n🔌 Verificando porta CDP...');
try {
  const response = await fetch(`${CDP_URL}/json/version`, { signal: AbortSignal.timeout(2000) });
  if (response.ok) {
    const data = await response.json();
    console.log(`   ✅ Chrome CDP já ativo!`);
    console.log(`   🌐 Browser: ${data.Browser}`);
    console.log(`\n🎉 Pronto! Execute: npm run test:cdp`);
    process.exit(0);
  }
} catch {
  console.log(`   📝 Porta ${CDP_PORT} livre`);
}

// 4. Iniciar Chrome com CDP + Profile 1
console.log('\n🌐 Iniciando Chrome com CDP + Profile 1...');
console.log(`   Porta: ${CDP_PORT}`);
console.log(`   Profile: Profile 1`);

const chromeArgs = [
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${USER_DATA_DIR}`,
  '--profile-directory=Profile 1',
  '--no-first-run',
  '--no-default-browser-check',
  'https://www.facebook.com'
];

console.log(`   📝 Comando: chrome.exe ${chromeArgs.join(' ')}`);

// Inicia Chrome
const chromeProcess = spawn(CHROME_PATH, chromeArgs, {
  detached: true,
  stdio: 'ignore',
  windowsHide: false // Mantém janela visível para ver se abriu
});

console.log(`   🆔 PID: ${chromeProcess.pid}`);

// 5. Aguardar CDP ficar pronto
console.log('\n⏳ Aguardando Chrome CDP ativar...');
console.log('   (Isso pode levar até 10 segundos)');

let attempts = 0;
const maxAttempts = 15;

while (attempts < maxAttempts) {
  attempts++;
  console.log(`   Tentativa ${attempts}/${maxAttempts}...`);
  
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const response = await fetch(`${CDP_URL}/json/version`, { 
      signal: AbortSignal.timeout(3000) 
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`\n✅ Chrome CDP ATIVO!`);
      console.log(`   🌐 Browser: ${data.Browser}`);
      console.log(`   🔧 Protocolo: ${data['Protocol-Version']}`);
      console.log(`   📱 WebKit: ${data['WebKit-Version']}`);
      
      // Verificar se Facebook está respondendo
      console.log(`\n🔍 Verificando Facebook...`);
      const listResponse = await fetch(`${CDP_URL}/json/list`);
      const pages = await listResponse.json();
      
      const fbPage = pages.find(p => p.url.includes('facebook.com'));
      if (fbPage) {
        console.log(`   ✅ Aba Facebook encontrada: ${fbPage.title}`);
        console.log(`   🔗 URL: ${fbPage.url.substring(0, 60)}...`);
        
        if (fbPage.title && !fbPage.title.includes('Facebook')) {
          console.log(`   👤 Usuário detectado: ${fbPage.title}`);
        }
      } else {
        console.log(`   ⚠️  Facebook ainda carregando...`);
        console.log(`   Páginas abertas: ${pages.length}`);
        pages.forEach(p => console.log(`      - ${p.title || 'Sem título'}`));
      }
      
      console.log(`\n🎉 PRONTO PARA TESTES!`);
      console.log(`   Execute: npm run test:cdp`);
      console.log(`\n💡 Dicas:`);
      console.log(`   - Não feche esta janela do Chrome`);
      console.log(`   - O Facebook deve estar logado automaticamente`);
      console.log(`   - Se não estiver logado, faça login manualmente`);
      
      process.exit(0);
    }
  } catch (err) {
    // Continua tentando
  }
}

// Falhou após todas as tentativas
console.error(`\n❌ FALHA: Chrome CDP não respondeu após ${maxAttempts} tentativas`);
console.error(`\n🔧 Possíveis causas:`);
console.error(`   1. Profile 1 corrompido ou sem login`);
console.error(`   2. Firewall bloqueando porta ${CDP_PORT}`);
console.error(`   3. Outro programa usando porta ${CDP_PORT}`);
console.error(`\n💡 Soluções:`);
console.error(`   - Abra Chrome normalmente, faça login no Facebook, feche`);
console.error(`   - Execute como Administrador`);
console.error(`   - Tente porta diferente editando CDP_PORT neste script`);

process.exit(1);
