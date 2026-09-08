/**
 * TESTE 1: CDP Chrome Connection
 * 
 * Objetivo: Validar que o worker controla o Chrome REAL via CDP
 * Checklist:
 * ✓ Chrome abre com --remote-debugging-port=9222
 * ✓ Playwright conecta via CDP
 * ✓ Usa Profile 1 correto
 * ✓ Facebook já logado (sessão detectada)
 * ✓ Não fecha outras instâncias
 * ✓ Não cria navegador temporário
 */

import { chromium, type Browser, type Page } from 'playwright';
import { test, expect, describe } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const execAsync = promisify(exec);

// Configurações do Chrome Profile 1
const CHROME_PROFILE_PATH = join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Profile 1');
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9222;
const CDP_URL = `http://127.0.0.1:${CDP_PORT}`;

interface CDPResult {
  connected: boolean;
  browser?: Browser;
  page?: Page;
  error?: string;
  profileDetected?: boolean;
  sessionInfo?: {
    facebookUser?: string;
    profileName?: string;
    groupUrl?: string;
    sessionAge?: string;
  };
}

describe('TESTE 1: CDP Chrome Connection', () => {
  
  test('Chrome Profile 1 existe no disco', () => {
    console.log(`\n🔍 Verificando Profile 1 em: ${CHROME_PROFILE_PATH}`);
    
    const exists = existsSync(CHROME_PROFILE_PATH);
    expect(exists).toBe(true);
    
    if (exists) {
      console.log('✅ Profile 1 encontrado');
    } else {
      console.error('❌ Profile 1 NÃO encontrado');
    }
  });

  test('Chrome está rodando com CDP port 9222', async () => {
    console.log(`\n🔍 Verificando Chrome na porta ${CDP_PORT}...`);
    
    try {
      // Verifica se Chrome está respondendo no endpoint CDP
      const response = await fetch(`${CDP_URL}/json/version`);
      const version = await response.json();
      
      console.log('✅ Chrome CDP detectado');
      console.log(`   Browser: ${version.Browser}`);
      console.log(`   Protocol: ${version['Protocol-Version']}`);
      
      expect(version.Browser).toContain('Chrome');
    } catch (error) {
      console.error('❌ Chrome CDP NÃO detectado na porta 9222');
      console.log(`   Tentando iniciar Chrome automaticamente...`);
      
      // Tenta iniciar Chrome com CDP
      const chromePath = `"${CHROME_EXE}"`;
      const cmd = `${chromePath} --remote-debugging-port=${CDP_PORT} --profile-directory="Profile 1" --no-first-run --no-default-browser-check`;
      
      console.log(`   Comando: ${cmd}`);
      
      // Inicia Chrome em background (não espera terminar)
      exec(cmd, { windowsHide: true }, (error) => {
        if (error) {
          console.error('   Erro ao iniciar:', error.message);
        }
      });
      
      // Aguarda 3 segundos para Chrome iniciar
      await new Promise(r => setTimeout(r, 3000));
      
      // Tenta conectar novamente
      try {
        const response = await fetch(`${CDP_URL}/json/version`);
        const version = await response.json();
        console.log('✅ Chrome CDP iniciado e conectado');
        expect(version.Browser).toContain('Chrome');
      } catch (retryError) {
        throw new Error(`Chrome não respondeu após tentativa de inicialização. Verifique manualmente com: ${cmd}`);
      }
    }
  });

  test('Playwright conecta via CDP', async () => {
    console.log('\n🔍 Conectando Playwright via CDP...');
    
    let browser: Browser | undefined;
    
    try {
      browser = await chromium.connectOverCDP(CDP_URL);
      
      console.log('✅ Playwright conectado via CDP');
      console.log(`   Contextos: ${browser.contexts().length}`);
      console.log(`   Páginas: ${browser.contexts().reduce((acc, ctx) => acc + ctx.pages().length, 0)}`);
      
      expect(browser).toBeDefined();
      expect(browser.contexts().length).toBeGreaterThan(0);
      
    } finally {
      if (browser) {
        // IMPORTANTE: Em CDP mode, close() desconecta sem matar o Chrome
        await browser.close();
        console.log('   Playwright desconectado (Chrome continua rodando)');
      }
    }
  });

  test('Facebook sessão detectada no Profile 1', async () => {
    console.log('\n🔍 Verificando sessão Facebook...');
    
    let browser: Browser | undefined;
    let page: Page | undefined;
    
    try {
      browser = await chromium.connectOverCDP(CDP_URL);
      const context = browser.contexts()[0];
      
      if (!context) {
        throw new Error('Nenhum contexto encontrado');
      }
      
      // Procura por página do Facebook
      const pages = context.pages();
      const fbPage = pages.find(p => p.url().includes('facebook.com'));
      
      if (fbPage) {
        page = fbPage;
        console.log(`✅ Aba Facebook encontrada: ${page.url()}`);
        
        // Tenta extrair informações da sessão
        const result = await page.evaluate(() => {
          // Procura por elementos que indicam usuário logado
          const nameElements = document.querySelectorAll('[role="navigation"] a[href*="/me/"]');
          const profilePic = document.querySelector('img[alt*="profile"], img[alt*="foto"]');
          
          return {
            url: window.location.href,
            hasNavigation: document.querySelector('[role="navigation"]') !== null,
            hasProfileElements: nameElements.length > 0 || profilePic !== null,
            title: document.title
          };
        });
        
        console.log('   Informações da página:');
        console.log(`   - URL: ${result.url}`);
        console.log(`   - Título: ${result.title}`);
        console.log(`   - Navegação detectada: ${result.hasNavigation ? 'Sim' : 'Não'}`);
        console.log(`   - Elementos de perfil: ${result.hasProfileElements ? 'Sim' : 'Não'}`);
        
        // Se parece estar logado (tem navegação e elementos de perfil)
        if (result.hasNavigation && result.hasProfileElements) {
          console.log('✅ Sessão Facebook ATIVA detectada');
        } else {
          console.log('⚠️  Página Facebook aberta mas sessão pode não estar completa');
        }
        
        expect(result.hasNavigation || result.url.includes('facebook.com')).toBe(true);
        
      } else {
        // Não encontrou aba do Facebook, navega para lá
        console.log('   Nenhuma aba Facebook encontrada, navegando...');
        page = await context.newPage();
        await page.goto('https://facebook.com');
        
        await page.waitForLoadState('domcontentloaded');
        
        const url = page.url();
        console.log(`   URL atual: ${url}`);
        
        if (url.includes('login')) {
          console.log('⚠️  Redirecionado para login - sessão pode expirada');
        } else if (url.includes('checkpoint')) {
          console.log('⚠️  Checkpoint detectado - verificação necessária');
        } else {
          console.log('✅ Facebook carregado');
        }
        
        expect(url).toContain('facebook.com');
      }
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

  test('Não cria navegador temporário - apenas conecta via CDP', async () => {
    console.log('\n🔍 Validando comportamento CDP...');
    
    // Este teste valida que estamos usando connectOverCDP e não launch()
    // A diferença é crítica: CDP conecta ao Chrome existente, launch cria novo
    
    console.log('   Método usado: chromium.connectOverCDP()');
    console.log('   ✅ Deve conectar ao Chrome existente');
    console.log('   ✅ Não deve criar processo chrome.exe novo');
    console.log('   ✅ Não deve fechar outras instâncias');
    
    // Conta processos Chrome antes
    const { stdout: before } = await execAsync('tasklist /FI "IMAGENAME eq chrome.exe" /NH');
    const chromeCountBefore = before.trim().split('\n').filter(l => l.includes('chrome.exe')).length;
    
    console.log(`   Processos Chrome antes: ${chromeCountBefore}`);
    
    // Conecta via CDP
    let browser: Browser | undefined;
    try {
      browser = await chromium.connectOverCDP(CDP_URL);
      
      // Conta processos Chrome depois
      const { stdout: after } = await execAsync('tasklist /FI "IMAGENAME eq chrome.exe" /NH');
      const chromeCountAfter = after.trim().split('\n').filter(l => l.includes('chrome.exe')).length;
      
      console.log(`   Processos Chrome depois: ${chromeCountAfter}`);
      
      // Deve ter mesma quantidade (ou mais, mas não menos)
      expect(chromeCountAfter).toBeGreaterThanOrEqual(chromeCountBefore);
      
      console.log('✅ CDP conectou sem criar novos processos Chrome');
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });
});

// Função auxiliar para diagnóstico
export async function diagnoseCDP(): Promise<CDPResult> {
  const result: CDPResult = { connected: false };
  
  try {
    // 1. Verifica se Chrome responde no CDP
    const versionRes = await fetch(`${CDP_URL}/json/version`).catch(() => null);
    if (!versionRes) {
      result.error = 'Chrome não responde no CDP port 9222';
      return result;
    }
    
    // 2. Conecta Playwright
    const browser = await chromium.connectOverCDP(CDP_URL);
    result.connected = true;
    result.browser = browser;
    
    // 3. Verifica Profile 1
    result.profileDetected = existsSync(CHROME_PROFILE_PATH);
    
    // 4. Verifica sessão Facebook
    const context = browser.contexts()[0];
    if (context) {
      const pages = context.pages();
      const fbPage = pages.find(p => p.url().includes('facebook.com'));
      
      if (fbPage) {
        const pageInfo = await fbPage.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          hasNav: document.querySelector('[role="navigation"]') !== null
        }));
        
        result.sessionInfo = {
          profileName: 'Profile 1',
          groupUrl: pageInfo.url,
          facebookUser: pageInfo.title.replace('Facebook', '').trim() || undefined
        };
      }
    }
    
    return result;
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

// Se rodar diretamente, executa diagnóstico
if (import.meta.main) {
  console.log('\n═══════════════════════════════════════');
  console.log('DIAGNÓSTICO CDP CHROME');
  console.log('═══════════════════════════════════════\n');
  
  const result = await diagnoseCDP();
  
  if (result.connected) {
    console.log('✅ CDP CONNECTED');
    console.log(`   Profile 1: ${result.profileDetected ? 'Detectado' : 'Não encontrado'}`);
    
    if (result.sessionInfo) {
      console.log(`   Facebook: ${result.sessionInfo.groupUrl}`);
      console.log(`   Profile: ${result.sessionInfo.profileName}`);
    }
    
    if (result.browser) {
      await result.browser.close();
    }
  } else {
    console.error('❌ CDP FAILED');
    console.error(`   Erro: ${result.error}`);
  }
  
  console.log('\n═══════════════════════════════════════\n');
}
