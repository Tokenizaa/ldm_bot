import { Page } from 'playwright';
import { ChromeConnector } from '../browser/chromeConnector';
import { BrowserConfig } from '../browser/browserConfig';

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
  private chromeConnector: ChromeConnector;

  constructor() {
    this.chromeConnector = ChromeConnector.getInstance();
  }

  async initialize(): Promise<void> {
    const connection = await this.chromeConnector.getConnection();
    this.page = await connection.context.newPage();
    
    await this.page.setViewportSize(BrowserConfig.VIEWPORT);
    await this.page.setDefaultTimeout(BrowserConfig.PAGE_LOAD_TIMEOUT);
  }

  private randomDelay(min?: number, max?: number): Promise<void> {
    const minDelay = min || BrowserConfig.RANDOM_DELAYS.MIN;
    const maxDelay = max || BrowserConfig.RANDOM_DELAYS.MAX;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    return this.page!.waitForTimeout(delay);
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

  async publishPost(content: PostContent, groupName: string): Promise<PublishingResult> {
    const startTime = Date.now();
    
    if (!this.page) {
      throw new Error('Facebook publisher não inicializado');
    }

    try {
      // 1. Movimento aleatório antes de começar
      await this.randomMouseMove();
      await this.randomDelay();

      // 2. Abrir grupo
      await this.page.goto('https://www.facebook.com/groups/', { waitUntil: 'networkidle' });
      await this.randomDelay(2000, 4000);
      
      // 3. Tentar encontrar grupo pelo nome
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
            await this.randomDelay(3000, 5000);
            groupFound = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      // Fallback: URL direta
      if (!groupFound && groupName === 'A Loja Do Mecânico') {
        await this.page.goto('https://www.facebook.com/groups/alojadomecanico', { waitUntil: 'networkidle' });
        await this.randomDelay(3000, 5000);
      }
      
      // 4. Encontrar campo de postagem
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
            await this.randomDelay(500, 1500);
            await postBox.click();
            await this.randomDelay(500, 1000);
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!postBox) {
        throw new Error('Campo de postagem não encontrado');
      }
      
      // 5. Digitar texto com comportamento humano
      await this.humanType(content.text);
      await this.randomDelay(1000, 2000);
      
      // 6. Adicionar link se fornecido
      if (content.link) {
        await this.page.keyboard.press('Enter');
        await this.randomDelay(500, 1000);
        await this.humanType(content.link);
        await this.randomDelay(1000, 2000);
      }
      
      // 7. Movimento aleatório antes de postar
      await this.randomMouseMove();
      await this.randomDelay(2000, 4000);
      
      // 8. Encontrar botão postar
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
      
      // 9. Postar com delay final
      await this.randomDelay(1000, 3000);
      await postButton.click();
      
      // 10. Aguardar postagem completar
      await this.randomDelay(5000, 8000);
      
      // Gerar ID fake
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
