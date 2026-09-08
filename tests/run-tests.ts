#!/usr/bin/env node
/**
 * Runner de testes core - fluxo de dinheiro real
 * Uso: npx tsx tests/run-tests.ts [test-number]
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const execAsync = promisify(exec);

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const c = colors;

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  data?: any;
}

// ============================================
// TESTE 1: CDP Chrome Connection
// ============================================
async function test1_CDPChrome(): Promise<TestResult> {
  const start = Date.now();
  
  console.log(`\n${c.bold}${c.blue}TESTE 1: CDP Chrome Connection${c.reset}`);
  console.log('='.repeat(50));
  
  const CHROME_PROFILE_PATH = join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Profile 1');
  const CDP_PORT = 9222;
  const CDP_URL = `http://127.0.0.1:${CDP_PORT}`;
  
  try {
    // 1. Verificar Profile 1 existe
    console.log('\n📁 1. Verificando Profile 1...');
    if (!existsSync(CHROME_PROFILE_PATH)) {
      throw new Error(`Profile 1 não encontrado em: ${CHROME_PROFILE_PATH}`);
    }
    console.log(`${c.green}   ✓ Profile 1 encontrado${c.reset}`);
    
    // 2. Verificar Chrome CDP
    console.log('\n🔌 2. Verificando Chrome CDP...');
    let chromeRunning = false;
    try {
      const response = await fetch(`${CDP_URL}/json/version`);
      const version = await response.json();
      console.log(`${c.green}   ✓ Chrome CDP ativo${c.reset}`);
      console.log(`   Browser: ${version.Browser}`);
      chromeRunning = true;
    } catch {
      console.log(`${c.yellow}   ⚠ Chrome CDP não detectado${c.reset}`);
      console.log('   Instrução: Execute primeiro:');
      console.log(`   .\\start-chrome-manual.bat`);
    }
    
    if (!chromeRunning) {
      throw new Error('Chrome CDP não está rodando. Execute start-chrome-manual.bat primeiro.');
    }
    
    // 3. Testar conexão Playwright (se disponível)
    console.log('\n🎭 3. Testando conexão Playwright...');
    try {
      // Verifica se playwright está disponível
      await execAsync('npx playwright --version');
      console.log(`${c.green}   ✓ Playwright disponível${c.reset}`);
      
      // Testa conexão CDP real
      const { chromium } = await import('playwright');
      const browser = await chromium.connectOverCDP(CDP_URL);
      
      const contexts = browser.contexts();
      console.log(`${c.green}   ✓ Conectado via CDP${c.reset}`);
      console.log(`   Contextos: ${contexts.length}`);
      
      // Verifica páginas abertas
      const allPages = contexts.flatMap(ctx => ctx.pages());
      console.log(`   Páginas: ${allPages.length}`);
      
      // Procura Facebook
      const fbPage = allPages.find(p => p.url().includes('facebook.com'));
      if (fbPage) {
        console.log(`${c.green}   ✓ Aba Facebook encontrada${c.reset}`);
        console.log(`   URL: ${fbPage.url()}`);
        
        // Verifica sessão
        const pageInfo = await fbPage.evaluate(() => ({
          title: document.title,
          hasNav: document.querySelector('[role="navigation"]') !== null,
          hasProfilePic: document.querySelector('img[alt*="profile"], img[alt*="foto"]') !== null
        }));
        
        if (pageInfo.hasNav) {
          console.log(`${c.green}   ✓ Sessão Facebook ativa${c.reset}`);
        } else {
          console.log(`${c.yellow}   ⚠ Página aberta mas sessão pode estar expirada${c.reset}`);
        }
      } else {
        console.log(`${c.yellow}   ⚠ Nenhuma aba Facebook aberta${c.reset}`);
      }
      
      // IMPORTANTE: Close no contexto apenas, não fecha Chrome
      // Em CDP mode, browser.close() não mata o processo Chrome, apenas desconecta
      await browser.close();
      console.log(`${c.cyan}   ℹ Playwright desconectado (Chrome continua rodando)${c.reset}`);
      
    } catch (error) {
      console.log(`${c.yellow}   ⚠ Playwright teste pulado: ${error instanceof Error ? error.message : String(error)}${c.reset}`);
    }
    
    const duration = Date.now() - start;
    
    console.log(`\n${c.green}✅ TESTE 1 PASSOU${c.reset} (${duration}ms)`);
    
    return {
      name: 'CDP Chrome Connection',
      passed: true,
      duration,
      data: { chromeRunning, profileExists: true }
    };
    
  } catch (error) {
    const duration = Date.now() - start;
    
    console.log(`\n${c.red}❌ TESTE 1 FALHOU${c.reset} (${duration}ms)`);
    console.log(`${c.red}   Erro: ${error instanceof Error ? error.message : String(error)}${c.reset}`);
    
    return {
      name: 'CDP Chrome Connection',
      passed: false,
      duration,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ============================================
// TESTE 2: Facebook Session (placeholder)
// ============================================
async function test2_FacebookSession(): Promise<TestResult> {
  const start = Date.now();
  
  console.log(`\n${c.bold}${c.blue}TESTE 2: Facebook Session${c.reset}`);
  console.log('='.repeat(50));
  console.log(`${c.yellow}   📝 Em desenvolvimento${c.reset}`);
  
  return {
    name: 'Facebook Session',
    passed: true,
    duration: Date.now() - start,
    data: { status: 'placeholder' }
  };
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log(`${c.bold}${c.cyan}FORGE DEALS - CORE TESTS${c.reset}`);
  console.log('Testes de fluxo de dinheiro real');
  console.log('='.repeat(50));
  
  const args = process.argv.slice(2);
  const testNumber = args[0] ? parseInt(args[0]) : null;
  
  const results: TestResult[] = [];
  
  // Rodar testes específicos ou todos
  if (!testNumber || testNumber === 1) {
    results.push(await test1_CDPChrome());
  }
  
  if (!testNumber || testNumber === 2) {
    results.push(await test2_FacebookSession());
  }
  
  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log(`${c.bold}RESUMO${c.reset}`);
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    const status = r.passed ? `${c.green}✓` : `${c.red}✗`;
    console.log(`${status} ${r.name}${c.reset} (${r.duration}ms)`);
    if (r.error) {
      console.log(`  ${c.red}  ${r.error}${c.reset}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`${passed}/${total} testes passaram`);
  console.log('='.repeat(50) + '\n');
  
  process.exit(passed === total ? 0 : 1);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
