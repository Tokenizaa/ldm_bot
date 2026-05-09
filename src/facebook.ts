import { Page } from 'playwright';
import { newPage, randomDelay } from './browser';

export interface PostContent {
  text: string;
  imageUrl?: string;
  link?: string;
}

export interface PublishingResult {
  success: boolean;
  postId?: string;
  publishedAt?: Date;
  error?: string;
  duration: number;
}

export class FacebookPublisher {
  private page: Page | null = null;

  async initialize(): Promise<void> {
    this.page = await newPage();
    await this.page.setViewportSize({ width: 1366, height: 768 });
    this.page.setDefaultTimeout(30000);
  }

  private async humanType(text: string): Promise<void> {
    if (!this.page) return;
    
    for (const char of text) {
      await this.page.keyboard.type(char);
      if (Math.random() > 0.8) {
        await this.page.waitForTimeout(Math.random() * 200 + 50);
      }
    }
  }

  private async randomMouseMove(): Promise<void> {
    if (!this.page) return;
    
    const x = Math.floor(Math.random() * 800) + 100;
    const y = Math.floor(Math.random() * 600) + 100;
    await this.page.mouse.move(x, y);
  }

  async isLoggedIn(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Verificar se já está logado acessando página principal
      await this.page.goto('https://www.facebook.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await randomDelay(1000, 2000);
      
      const currentUrl = this.page.url();
      
      // Se está em página de login, não está logado
      if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
        return false;
      }

      // Verificar indicadores de login
      const hasCreatePost = await this.page.locator('[role="textbox"][aria-label*="Escreva"], [contenteditable="true"][data-text="post"]').count() > 0;
      const hasUserMenu = await this.page.locator('[aria-label*="Conta"], [aria-label*="Menu"], [data-testid="user-menu"]').count() > 0;
      const hasHomeButton = await this.page.locator('a[href*="/home"], [aria-label*="Página inicial"]').count() > 0;
      
      if (hasCreatePost || hasUserMenu || hasHomeButton) {
        console.log('✅ Já está logado no Facebook');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.log('Erro ao verificar login Facebook:', error);
      return false;
    }
  }

  async publishPost(content: PostContent, groupName: string): Promise<PublishingResult> {
    const startTime = Date.now();
    
    if (!this.page) {
      throw new Error('Facebook publisher não inicializado');
    }

    try {
      // PRIMEIRO: Verificar se já está logado
      if (!await this.isLoggedIn()) {
        throw new Error('Não está logado no Facebook. Por favor, faça login manualmente primeiro.');
      }

      await this.randomMouseMove();
      await randomDelay();

      await this.page.goto('https://www.facebook.com/groups/', { waitUntil: 'networkidle' });
      await randomDelay(2000, 4000);
      
      const groupSelectors = [
        `div[role="article"]:has-text("${groupName}")`,
        `a[href*="${groupName.replace(/\s+/g, '-').toLowerCase()}"]`,
        `[aria-label*="${groupName}"]`,
        `span:has-text("${groupName}")`
      ];
      
      let groupFound = false;
      for (const selector of groupSelectors) {
        try {
          const element = await this.page.waitForSelector(selector, { timeout: 3000 });
          if (await element.isVisible()) {
            await element.click();
            await randomDelay(3000, 5000);
            groupFound = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!groupFound && groupName === 'A Loja Do Mecânico') {
        await this.page.goto('https://www.facebook.com/groups/alojadomecanico', { waitUntil: 'networkidle' });
        await randomDelay(3000, 5000);
      }
      
      await this.randomMouseMove();
      
      const postSelectors = [
        '[role="textbox"][aria-label*="Escreva"]',
        '[role="textbox"][placeholder*="Escreva"]',
        '[role="textbox"][aria-label*="post"]',
        '[contenteditable="true"][data-text="post"]',
        '.x1he5i1 textarea',
        '[data-testid="status-attachment-mentions-input"]',
        'div[contenteditable="true"]',
        'textarea[placeholder*="O que você está pensando"]'
      ];
      
      let postBox = null;
      for (const selector of postSelectors) {
        try {
          postBox = await this.page.waitForSelector(selector, { timeout: 5000 });
          if (postBox) {
            await randomDelay(500, 1500);
            await postBox.click();
            await randomDelay(500, 1000);
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!postBox) {
        throw new Error('Campo de postagem não encontrado');
      }
      
      await this.humanType(content.text);
      await randomDelay(1000, 2000);
      
      if (content.link) {
        await this.page.keyboard.press('Enter');
        await randomDelay(500, 1000);
        await this.humanType(content.link);
        await randomDelay(1000, 2000);
      }
      
      await this.randomMouseMove();
      await randomDelay(2000, 4000);
      
      const postButtonSelectors = [
        '[aria-label*="Publicar"]',
        '[aria-label*="Post"]',
        'button:has-text("Publicar")',
        'button:has-text("Post")',
        '.x1i10hfl button',
        '[data-testid="react-composer-post-button"]',
        'div[role="button"]:has-text("Publicar")',
        'span:has-text("Publicar")'
      ];
      
      let postButton = null;
      for (const selector of postButtonSelectors) {
        try {
          const buttons = await this.page.locator(selector).all();
          for (const button of buttons) {
            const text = await button.textContent();
            if (text && (text.includes('Publicar') || text.includes('Post'))) {
              postButton = button;
              break;
            }
          }
          if (postButton) break;
        } catch {
          continue;
        }
      }
      
      if (!postButton) {
        throw new Error('Botão de postagem não encontrado');
      }
      
      await randomDelay(1000, 3000);
      await postButton.click();
      
      await randomDelay(5000, 8000);
      
      const postId = `fb_${Date.now()}`;
      
      return {
        success: true,
        postId,
        publishedAt: new Date(),
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }
}

export async function publishToFacebook(content: PostContent, groupName: string = 'A Loja Do Mecânico'): Promise<PublishingResult> {
  const publisher = new FacebookPublisher();
  
  try {
    await publisher.initialize();
    return await publisher.publishPost(content, groupName);
  } finally {
    await publisher.cleanup();
  }
}
