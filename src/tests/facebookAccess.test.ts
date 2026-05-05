import { ChromeConnector, BrowserHealth, SessionMonitor, TabsManager } from '../modules/browser';

async function testFacebookAccess() {
  console.log('🧪 Iniciando teste de acesso ao Facebook com arquitetura CDP...\n');

  // 1. Inicializar componentes
  const connector = ChromeConnector.getInstance();
  const health = BrowserHealth.getInstance();
  const sessionMonitor = SessionMonitor.getInstance();
  const tabsManager = TabsManager.getInstance();

  try {
    // 2. Verificar saúde do browser
    console.log('🏥 Verificando saúde do browser...');
    await health.startMonitoring();
    await health.waitForHealthy(30000);
    
    const healthStatus = health.getStatus();
    console.log(`✅ Browser saudável: ${health.getHealthSummary()}\n`);

    // 3. Conectar ao Chrome
    console.log('🔌 Conectando ao Chrome via CDP...');
    const connection = await connector.getConnection();
    console.log(`✅ Conectado com sucesso! Reconnect attempts: ${connector.getReconnectAttempts()}\n`);

    // 4. Validar sessão Facebook
    console.log('🔐 Validando sessão do Facebook...');
    await sessionMonitor.validateFacebookSession();
    
    const sessionStatus = sessionMonitor.getStatus();
    console.log(`📘 Facebook Status: ${sessionStatus.facebook.isLoggedIn ? '✅ Logado' : '❌ Não logado'}`);
    console.log(`👤 Username: ${sessionStatus.facebook.username || 'N/A'}`);
    console.log(`🍪 Cookies: ${sessionStatus.facebook.cookiesCount}\n`);

    // 5. Abrir aba do Facebook
    console.log('🔗 Abrindo aba do Facebook...');
    const facebookTab = await tabsManager.getOrCreateTab('https://www.facebook.com', true);
    console.log(`✅ Aba aberta: ${facebookTab.title}\n`);

    // 6. Criar página e navegar
    console.log('📄 Criando página Playwright...');
    const page = await connection.context.newPage();
    
    console.log('🌐 Navegando para Facebook...');
    await page.goto('https://www.facebook.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 7. Verificar estado da página
    console.log('🔍 Verificando estado da página...');
    const currentUrl = page.url();
    console.log(`📍 URL atual: ${currentUrl}`);

    // Verificar se está logado
    const isLoggedIn = currentUrl.includes('facebook.com') && !currentUrl.includes('/login');
    
    if (isLoggedIn) {
      console.log('✅ Usuário está logado no Facebook!');
      
      // Tentar encontrar elementos de usuário logado
      try {
        await page.waitForSelector('[data-testid="user_menu"]', { timeout: 5000 });
        console.log('✅ Menu de usuário encontrado - sessão confirmada');
      } catch {
        console.log('⚠️ Menu não encontrado, mas URL indica login');
      }
      
      // Capturar screenshot
      try {
        const screenshot = await page.screenshot({ fullPage: true });
        console.log('📸 Screenshot capturado com sucesso');
      } catch (error) {
        console.log('⚠️ Erro ao capturar screenshot:', error);
      }
      
    } else {
      console.log('❌ Usuário não está logado ou página de login');
      
      // Verificar se tem formulário de login
      try {
        await page.waitForSelector('form[data-testid="royal_login_form"]', { timeout: 3000 });
        console.log('🔐 Formulário de login detectado');
      } catch {
        console.log('❓ Formulário de login não encontrado');
      }
    }

    // 8. Testar funcionalidades básicas
    console.log('\n🧪 Testando funcionalidades básicas...');
    
    // Testar avaliação de JavaScript
    const pageTitle = await page.evaluate(() => document.title);
    console.log(`📄 Título da página: ${pageTitle}`);

    // Testar contagem de elementos
    const linkCount = await page.evaluate(() => document.querySelectorAll('a').length);
    console.log(`🔗 Links encontrados: ${linkCount}`);

    // 9. Limpeza
    console.log('\n🧹 Limpando recursos...');
    await page.close();
    await tabsManager.autoCleanupIfNeeded();
    
    console.log('\n✅ Teste concluído com sucesso!');
    
    return {
      success: true,
      healthStatus,
      sessionStatus,
      isLoggedIn,
      pageTitle,
      linkCount
    };

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    
    // Tentar diagnóstico
    try {
      console.log('\n🔍 Tentando diagnóstico...');
      
      // Verificar se Chrome está rodando
      const response = await fetch('http://localhost:9222/json/version');
      if (response.ok) {
        const version = await response.json();
        console.log(`✅ Chrome respondendo: ${version.Browser}`);
      } else {
        console.log('❌ Chrome não responde em localhost:9222');
        console.log('💡 Inicie Chrome com: chrome.exe --remote-debugging-port=9222');
      }
    } catch (diagError) {
      console.log('❌ Falha no diagnóstico:', diagError);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  } finally {
    // Parar monitoramento
    health.stopMonitoring();
  }
}

// Executar teste
if (require.main === module) {
  testFacebookAccess()
    .then((result) => {
      console.log('\n📊 Resultado final:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

export { testFacebookAccess };
