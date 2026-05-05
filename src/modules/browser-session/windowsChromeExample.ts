import { chromium } from 'playwright';
import { WindowsChromeConfig } from './windowsChromeConfig';

/**
 * Exemplo de uso do Windows Chrome com sessão real
 * Baseado no exemplo fornecido pelo usuário
 */
async function main() {
  // Usar Profile 1 do Chrome (como no seu exemplo)
  const userDataDir = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data';
  const profileName = 'Profile 1';

  try {
    // Iniciar contexto persistente com perfil existente
    const context = await chromium.launchPersistentContext(
      userDataDir,
      {
        channel: 'chrome', // Importante: usar canal Chrome
        headless: false,   // MUITO IMPORTANTE: headless false como solicitado
        args: [
          `--profile-directory=${profileName}`,
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      }
    );

    // Criar nova página
    const page = await context.newPage();

    // Navegar para o Facebook (como no seu exemplo)
    await page.goto('https://facebook.com');

    console.log('Facebook aberto com sessão real.');

    // Aguardar 10 minutos (600 segundos) como no seu exemplo
    await page.waitForTimeout(600000);

    // Fechar contexto
    await context.close();

  } catch (error) {
    console.error('Erro ao executar exemplo:', error);
  }
}

/**
 * Exemplo usando a classe WindowsChromeConfig
 */
async function exampleWithConfig() {
  try {
    // Obter configuração para Facebook
    const { profileInfo, browserConfig } = WindowsChromeConfig.getFacebookConfig();

    console.log('Usando perfil:', profileInfo.name);
    console.log('Caminho do perfil:', profileInfo.directory);

    // Iniciar com configuração personalizada
    const context = await chromium.launchPersistentContext(
      profileInfo.directory,
      {
        channel: 'chrome',
        headless: false, // MUITO IMPORTANTE
        args: browserConfig.extraArgs || []
      }
    );

    const page = await context.newPage();
    await page.goto('https://facebook.com');

    console.log('Facebook aberto com configuração personalizada.');

    // Verificar se está logado
    const isLoggedIn = await page.evaluate(() => {
      const loginButton = document.querySelector('[data-testid="royal_login_button"]');
      const profileButton = document.querySelector('[aria-label="Account"]');
      return !loginButton && !!profileButton;
    });

    console.log('Status de login:', isLoggedIn ? 'Autenticado' : 'Não autenticado');

    await page.waitForTimeout(30000); // 30 segundos
    await context.close();

  } catch (error) {
    console.error('Erro no exemplo com configuração:', error);
  }
}

/**
 * Exemplo para Loja do Mecânico
 */
async function exampleLojaDoMecanico() {
  try {
    // Obter configuração para Loja do Mecânico (Profile 2)
    const { profileInfo, browserConfig } = WindowsChromeConfig.getLojaDoMecanicoConfig();

    console.log('Usando perfil para Loja do Mecânico:', profileInfo.name);

    const context = await chromium.launchPersistentContext(
      profileInfo.directory,
      {
        channel: 'chrome',
        headless: false, // MUITO IMPORTANTE
        args: browserConfig.extraArgs || []
      }
    );

    const page = await context.newPage();
    await page.goto('https://www.lojadomecanico.com.br/login');

    console.log('Loja do Mecânico aberta.');

    // Preencher credenciais (se necessário)
    await page.fill('input[name="email"]', 'olfnetto@gmail.com');
    await page.fill('input[name="password"]', 'Netto964212$');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('Login realizado com sucesso!');

    await page.waitForTimeout(30000);
    await context.close();

  } catch (error) {
    console.error('Erro no exemplo da Loja do Mecânico:', error);
  }
}

/**
 * Verificar perfis disponíveis
 */
async function checkAvailableProfiles() {
  try {
    const profiles = await WindowsChromeConfig.getAvailableProfiles();
    console.log('Perfis disponíveis:', profiles);

    // Verificar se perfis específicos existem
    const profile1Exists = WindowsChromeConfig.profileExists('Profile 1');
    const profile2Exists = WindowsChromeConfig.profileExists('Profile 2');

    console.log('Profile 1 existe:', profile1Exists);
    console.log('Profile 2 existe:', profile2Exists);

    // Obter informações detalhadas
    if (profile1Exists) {
      const profile1Info = WindowsChromeConfig.getProfileInfo('Profile 1');
      console.log('Info Profile 1:', profile1Info);
    }

    if (profile2Exists) {
      const profile2Info = WindowsChromeConfig.getProfileInfo('Profile 2');
      console.log('Info Profile 2:', profile2Info);
    }

  } catch (error) {
    console.error('Erro ao verificar perfis:', error);
  }
}

// Exportar funções para uso
export {
  main,
  exampleWithConfig,
  exampleLojaDoMecanico,
  checkAvailableProfiles
};

// Executar exemplo principal se chamado diretamente
if (require.main === module) {
  main();
}
