import { chromium, Browser, BrowserContext, Page } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

interface LoginCredentials {
  email: string;
  password: string;
}

export class LoginManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private storageStatePath = './worker/auth/storageState.json';

  async initialize(): Promise<void> {
    console.log('🚀 Inicializando browser para login...');
    
    this.browser = await chromium.launch({ 
      headless: false, // Headless false para login manual
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await this.context.newPage();
    console.log('✅ Browser inicializado com sucesso');
  }

  async performLogin(credentials: LoginCredentials): Promise<boolean> {
    if (!this.page) throw new Error('Página não inicializada');

    try {
      console.log('🔐 Iniciando processo de login...');
      
      // Step 1: Acessar página de login
      await this.page.goto('https://www.lojadomecanico.com.br/login', { 
        waitUntil: 'networkidle' 
      });
      
      console.log('📄 Página de login carregada');

      // Step 2: Preencher email
      await this.page.waitForSelector('[placeholder*="E-mail"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="E-mail"]', credentials.email);
      await this.page.click('button:has-text("Continuar")');
      
      console.log('📧 Email preenchido');

      // Step 3: Preencher senha
      await this.page.waitForSelector('[placeholder*="Senha"]', { timeout: 10000 });
      await this.page.fill('[placeholder*="Senha"]', credentials.password);
      await this.page.click('button:has-text("Continuar")');
      
      console.log('🔑 Senha preenchida');

      // Step 4: Verificar login bem-sucedido
      await this.page.waitForSelector('[data-user]', { timeout: 15000 });
      
      console.log('✅ Login realizado com sucesso!');
      
      // Aguardar um pouco para garantir que a sessão está estável
      await this.page.waitForTimeout(3000);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    }
  }

  async saveStorageState(): Promise<void> {
    if (!this.context) throw new Error('Context não inicializado');

    try {
      // Criar diretório se não existir
      const fs = require('fs');
      const path = require('path');
      
      const dir = path.dirname(this.storageStatePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await this.context.storageState({ path: this.storageStatePath });
      console.log('💾 Storage state salvo em:', this.storageStatePath);
    } catch (error) {
      console.error('❌ Erro ao salvar storage state:', error);
      throw error;
    }
  }

  async verifyLogin(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const isLoggedIn = await this.page.locator('[data-user]').count() > 0;
      
      if (isLoggedIn) {
        console.log('✅ Login verificado com sucesso');
        
        // Capturar informações do usuário
        const userInfo = await this.page.evaluate(() => {
          const userElement = document.querySelector('[data-user]');
          return {
            name: userElement?.textContent?.trim(),
            logged: true
          };
        });
        
        console.log('👤 Usuário logado:', userInfo.name);
        return true;
      } else {
        console.log('❌ Login não verificado');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar login:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
      
      console.log('🧹 Browser fechado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fechar browser:', error);
    }
  }
}

// Função principal de login
async function main(): Promise<void> {
  const loginManager = new LoginManager();
  
  try {
    if (!process.env.LOJA_DO_MECANICO_EMAIL || !process.env.LOJA_DO_MECANICO_PASSWORD) {
      throw new Error('Missing required env vars: LOJA_DO_MECANICO_EMAIL / LOJA_DO_MECANICO_PASSWORD');
    }

    // Obter credenciais
    const credentials: LoginCredentials = {
      email: process.env.LOJA_DO_MECANICO_EMAIL,
      password: process.env.LOJA_DO_MECANICO_PASSWORD
    };

    console.log('🔧 Credenciais configuradas');
    console.log(`📧 Email: ${credentials.email}`);
    console.log('🔑 Senha: [CONFIGURADA]');

    // Inicializar browser
    await loginManager.initialize();

    // Realizar login
    const loginSuccess = await loginManager.performLogin(credentials);
    
    if (!loginSuccess) {
      throw new Error('Falha no login');
    }

    // Verificar login
    const loginVerified = await loginManager.verifyLogin();
    
    if (!loginVerified) {
      throw new Error('Login não verificado');
    }

    // Salvar storage state
    await loginManager.saveStorageState();

    console.log('🎉 Processo de login concluído com sucesso!');
    console.log('📁 Storage state salvo para uso futuro');
    console.log('🚀 Agora você pode executar o crawler com: npm run worker');

  } catch (error) {
    console.error('💥 Erro no processo de login:', error);
    process.exit(1);
  } finally {
    await loginManager.cleanup();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as runLogin };
