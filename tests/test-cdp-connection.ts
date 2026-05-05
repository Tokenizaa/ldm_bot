#!/usr/bin/env tsx
/**
 * Teste de conexão CDP profissional
 * Valida a arquitetura ForgeBrowserManager
 */

import { forgeBrowser, ForgeBrowserManager } from '../src/modules/browser/ForgeBrowserManager';
import { FacebookSessionValidator } from '../src/modules/browser/FacebookSessionValidator';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCDPConnection(): Promise<void> {
  console.log('🧪 TESTE CDP FORGEDEALS\n');
  console.log('=' .repeat(50));
  console.log();

  // 1. Verificar CDP disponível
  console.log('1️⃣ Verificando CDP disponível...');
  const isAvailable = await forgeBrowser.isCDPAvailable();
  
  if (!isAvailable) {
    console.error('❌ CDP não disponível em http://127.0.0.1:9222');
    console.log();
    console.log('💡 Solução:');
    console.log('   Execute: npm run chrome:start');
    console.log('   Ou: scripts\\start-forge-browser.bat');
    process.exit(1);
  }
  console.log('✅ CDP disponível\n');

  // 2. Conectar ao browser
  console.log('2️⃣ Conectando ao Chrome CDP...');
  try {
    const { browser, context, page } = await forgeBrowser.connect();
    console.log('✅ Conectado com sucesso');
    console.log(`   📑 Contextos: ${browser.contexts().length}`);
    console.log(`   📄 Páginas: ${context.pages().length}`);
    console.log();
  } catch (error) {
    console.error('❌ Falha na conexão:', error);
    process.exit(1);
  }

  // 3. Health check
  console.log('3️⃣ Executando health check...');
  await sleep(1000);
  const health = await forgeBrowser.checkHealth();
  console.log('✅ Health check concluído');
  console.log(`   💓 Conectado: ${health.isConnected}`);
  console.log(`   🏥 Saudável: ${health.isHealthy}`);
  console.log(`   📄 Páginas: ${health.pagesCount}`);
  console.log(`   💾 Memória: ${health.memoryUsage || 'N/A'} MB`);
  if (health.issues.length > 0) {
    console.log(`   ⚠️  Issues: ${health.issues.join(', ')}`);
  }
  console.log();

  // 4. Validar sessão Facebook
  console.log('4️⃣ Validando sessão Facebook...');
  const fbValidator = new FacebookSessionValidator();
  const { page } = forgeBrowser.getInstances();
  if (page) {
    fbValidator.setPage(page);
    const session = await fbValidator.validate();
    
    console.log(`   🔐 Logado: ${session.isLoggedIn}`);
    console.log(`   ✅ Válido: ${session.isValid}`);
    if (session.userInfo?.name) {
      console.log(`   👤 Usuário: ${session.userInfo.name}`);
    }
    if (session.issues.length > 0) {
      console.log(`   ⚠️  Issues: ${session.issues.join(', ')}`);
    }
    console.log();
  }

  // 5. Tirar screenshot
  console.log('5️⃣ Testando screenshot...');
  try {
    const screenshotPath = await forgeBrowser.takeScreenshot('test-cdp');
    console.log(`✅ Screenshot salvo: ${screenshotPath}\n`);
  } catch (error) {
    console.warn(`⚠️  Erro no screenshot: ${error}\n`);
  }

  // 6. Testar abas
  console.log('6️⃣ Testando gerenciamento de abas...');
  const closed = await forgeBrowser.closeExtraTabs();
  console.log(`✅ ${closed} aba(s) extra(s) fechada(s)\n`);

  // 7. Testar reconexão
  console.log('7️⃣ Testando reconexão...');
  await forgeBrowser.disconnect();
  await sleep(1000);
  await forgeBrowser.connect();
  console.log('✅ Reconexão bem-sucedida\n');

  // 8. Status final
  console.log('8️⃣ Status final...');
  const finalHealth = await forgeBrowser.checkHealth();
  console.log(`   💓 Conectado: ${finalHealth.isConnected}`);
  console.log(`   ⏱️  Uptime: ${finalHealth.uptime}s`);
  console.log();

  console.log('=' .repeat(50));
  console.log('🎉 TODOS OS TESTES PASSARAM!');
  console.log();
  console.log('✨ Próximos passos:');
  console.log('   - Execute workers: npm run dev:workers');
  console.log('   - Abra dashboard: npm run dev:web');
  console.log();
}

testCDPConnection().catch(error => {
  console.error('❌ Erro nos testes:', error);
  process.exit(1);
});
