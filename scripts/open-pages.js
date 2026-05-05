#!/usr/bin/env node
/**
 * Abre Facebook e Loja do Mecânico no Chrome CDP
 */

import { chromium } from 'playwright';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function openPages() {
  console.log('🔗 Conectando ao Chrome CDP...\n');

  try {
    // Conectar ao CDP
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    // Obter página atual (Facebook já aberto pelo Chrome)
    const pages = context.pages();
    let fbPage = pages.find(p => p.url().includes('facebook.com'));
    
    if (!fbPage) {
      console.log('🌐 Abrindo Facebook...');
      fbPage = await context.newPage();
      await fbPage.goto('https://www.facebook.com');
      await sleep(3000);
    } else {
      console.log('✅ Facebook já está aberto');
      // Recarregar para garantir
      await fbPage.reload();
      await sleep(2000);
    }

    // Verificar se está logado
    const title = await fbPage.title();
    console.log(`📱 Título: ${title}`);
    
    // Verificar elemento de login
    const hasLogin = await fbPage.$('input[name="email"]');
    if (hasLogin) {
      console.log('⚠️  Página de login detectada - faça login manualmente');
    } else {
      console.log('👤 Usuário aparentemente logado');
    }

    // Abrir Loja do Mecânico em nova aba
    console.log('\n🛠️ Abrindo Loja do Mecânico...');
    const ldmPage = await context.newPage();
    await ldmPage.goto('https://www.lojadomecanico.com.br');
    await sleep(3000);

    const ldmTitle = await ldmPage.title();
    console.log(`📱 Título: ${ldmTitle}`);
    console.log(`🔗 URL: ${ldmPage.url()}`);

    console.log('\n✅ PÁGINAS ABERTAS COM SUCESSO!');
    console.log('   📘 Facebook: Primeira aba');
    console.log('   🛠️ Loja do Mecânico: Segunda aba');
    console.log('\n💡 Você pode interagir com as abas manualmente');

    // Manter script rodando
    console.log('\n⏳ Mantendo conexão (Ctrl+C para sair)...');
    
    // Verificar periodicamente
    while (true) {
      await sleep(5000);
      const isConnected = browser.isConnected();
      if (!isConnected) {
        console.log('\n⚠️  Browser desconectado');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('connect')) {
      console.log('\n💡 Execute primeiro: npm run chrome:start');
    }
    process.exit(1);
  }
}

openPages();
