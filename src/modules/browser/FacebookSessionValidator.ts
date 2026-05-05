import { Page, BrowserContext } from 'playwright';
import { SessionValidationResult } from './ForgeBrowserManager';

/**
 * Validador de sessão do Facebook
 * Verifica se usuário está logado e obtém informações básicas
 */
export class FacebookSessionValidator {
  private page: Page | null = null;

  constructor(page?: Page) {
    if (page) {
      this.page = page;
    }
  }

  setPage(page: Page): void {
    this.page = page;
  }

  /**
   * Valida sessão do Facebook na página atual
   */
  async validate(): Promise<SessionValidationResult> {
    if (!this.page) {
      return {
        platform: 'facebook',
        isValid: false,
        isLoggedIn: false,
        issues: ['Página não disponível']
      };
    }

    const issues: string[] = [];
    let isLoggedIn = false;
    let userInfo: SessionValidationResult['userInfo'] = {};

    try {
      // Navegar para Facebook se não estiver lá
      const currentUrl = this.page.url();
      if (!currentUrl.includes('facebook.com')) {
        console.log('🌐 Navegando para Facebook...');
        await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });
        await this.page.waitForTimeout(2000);
      }

      // Verificar se está na página de login
      const loginForm = await this.page.$('input[name="email"]');
      const loginButton = await this.page.$('button[name="login"]');
      
      if (loginForm && loginButton) {
        issues.push('Página de login detectada - usuário não logado');
        return {
          platform: 'facebook',
          isValid: false,
          isLoggedIn: false,
          issues
        };
      }

      // Verificar elementos de usuário logado
      const navProfile = await this.page.$('[aria-label="Your profile"]');
      const accountMenu = await this.page.$('[data-testid="account_menu"]');
      const userNav = await this.page.$('div[role="navigation"] a[href*="/profile"]');
      
      isLoggedIn = !!(navProfile || accountMenu || userNav);

      if (!isLoggedIn) {
        issues.push('Elementos de usuário logado não encontrados');
        
        // Verificar se há mensagem de conta suspensa/bloqueada
        const suspendedText = await this.page.$('text=/suspens|bloquead|disabled/i');
        if (suspendedText) {
          issues.push('Conta pode estar suspensa ou bloqueada');
        }
        
        return {
          platform: 'facebook',
          isValid: false,
          isLoggedIn: false,
          issues
        };
      }

      // Tentar obter nome do usuário
      try {
        // Método 1: Menu de conta
        const accountButton = await this.page.$('[aria-label="Your profile"], [data-testid="account_menu"]');
        if (accountButton) {
          await accountButton.click();
          await this.page.waitForTimeout(1000);
          
          const nameElement = await this.page.$('text=/^(?!.*Facebook).*\\w+\\s\\w+/');
          if (nameElement) {
            userInfo.name = await nameElement.textContent() || undefined;
          }
          
          // Fechar menu
          await this.page.keyboard.press('Escape');
        }

        // Método 2: Título da página
        const title = await this.page.title();
        if (title && !title.includes('Facebook') && !title.includes('Log')) {
          userInfo.name = title.split(' | ')[0] || undefined;
        }

      } catch (e) {
        console.warn('⚠️ Não foi possível obter nome do usuário:', e);
      }

      console.log('✅ Sessão Facebook válida', userInfo.name ? `- ${userInfo.name}` : '');

      return {
        platform: 'facebook',
        isValid: true,
        isLoggedIn: true,
        userInfo,
        issues
      };

    } catch (error) {
      issues.push(`Erro na validação: ${error}`);
      return {
        platform: 'facebook',
        isValid: false,
        isLoggedIn: false,
        issues
      };
    }
  }

  /**
   * Verifica se pode acessar um grupo específico
   */
  async validateGroupAccess(groupUrl: string): Promise<{
    accessible: boolean;
    canPost: boolean;
    isMember: boolean;
    issues?: string[];
  }> {
    if (!this.page) {
      return {
        accessible: false,
        canPost: false,
        isMember: false,
        issues: ['Página não disponível']
      };
    }

    const issues: string[] = [];

    try {
      console.log(`🔍 Verificando acesso ao grupo: ${groupUrl}`);
      
      await this.page.goto(groupUrl, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);

      // Verificar se grupo existe e é acessível
      const notFound = await this.page.$('text=/não encontrado|não disponível|not found/i');
      const privateGroup = await this.page.$('text=/grupo privado|private group|membro para ver/i');
      
      if (notFound) {
        issues.push('Grupo não encontrado ou não existe');
        return {
          accessible: false,
          canPost: false,
          isMember: false,
          issues
        };
      }

      // Verificar se é membro
      const joinButton = await this.page.$('text=/participar|join group|entrar no grupo/i');
      const isMember = !joinButton;

      if (!isMember) {
        issues.push('Usuário não é membro do grupo');
        return {
          accessible: true,
          canPost: false,
          isMember: false,
          issues
        };
      }

      // Verificar se pode postar (caixa de postagem visível)
      const postBox = await this.page.$('[contenteditable="true"], [role="textbox"]');
      const createPost = await this.page.$('text=/criar publicação|what.*mind|escrever algo/i');
      const canPost = !!(postBox || createPost);

      if (!canPost) {
        issues.push('Não é possível identificar caixa de postagem');
      }

      console.log(`✅ Grupo acessível - Membro: ${isMember}, Pode postar: ${canPost}`);

      return {
        accessible: true,
        canPost,
        isMember,
        issues: issues.length > 0 ? issues : undefined
      };

    } catch (error) {
      issues.push(`Erro ao verificar grupo: ${error}`);
      return {
        accessible: false,
        canPost: false,
        isMember: false,
        issues
      };
    }
  }

  /**
   * Verifica se há bloqueios ou verificações de segurança
   */
  async checkForBlocks(): Promise<{
    hasBlock: boolean;
    blockType?: string;
    requiresAction: boolean;
    message?: string;
  }> {
    if (!this.page) {
      return {
        hasBlock: false,
        requiresAction: false
      };
    }

    try {
      // Verificar checkpoint de segurança
      const checkpoint = await this.page.$('text=/checkpoint|confirmar identidade|security check/i');
      if (checkpoint) {
        return {
          hasBlock: true,
          blockType: 'checkpoint',
          requiresAction: true,
          message: 'Checkpoint de segurança detectado'
        };
      }

      // Verificar conta suspensa
      const suspended = await this.page.$('text=/conta suspensa|account suspended|desativada/i');
      if (suspended) {
        return {
          hasBlock: true,
          blockType: 'suspended',
          requiresAction: true,
          message: 'Conta suspensa ou desativada'
        };
      }

      // Verificar confirmação de identidade
      const identity = await this.page.$('text=/upload.*photo|foto.*perfil|confirmar identidade/i');
      if (identity) {
        return {
          hasBlock: true,
          blockType: 'identity_verification',
          requiresAction: true,
          message: 'Verificação de identidade necessária'
        };
      }

      // Verificar CAPTCHA
      const captcha = await this.page.$('text=/captcha|não sou um robô|i\'m not a robot/i');
      if (captcha) {
        return {
          hasBlock: true,
          blockType: 'captcha',
          requiresAction: true,
          message: 'CAPTCHA detectado'
        };
      }

      return {
        hasBlock: false,
        requiresAction: false
      };

    } catch (error) {
      console.warn('⚠️ Erro ao verificar bloqueios:', error);
      return {
        hasBlock: false,
        requiresAction: false
      };
    }
  }
}
