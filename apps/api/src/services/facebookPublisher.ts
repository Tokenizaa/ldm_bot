import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { SystemConfig } from '../../web/src/types/config';

export interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export class FacebookPublisher {
  private connection: { browser: Browser; context: BrowserContext; isConnected: boolean } | null = null;
  private page: Page | null = null;
  private config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const cdpUrl = `http://localhost:${this.config.system?.cdpPort || 9222}`;
    const browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();
    
    if (!contexts.length) {
      throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    }

    const context = contexts[0];
    
    this.connection = {
      browser,
      context,
      isConnected: true
    };

    this.page = await context.newPage();
    await this.setupPage();
  }

  private async setupPage(): Promise<void> {
    if (!this.page) return;
    
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    });
    this.page.setDefaultTimeout(30000);
  }

  async publishPost(content: { text: string; link: string; imageUrl?: string }, groupName: string): Promise<PublishResult> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Navigate to group
      const groupId = this.config.facebook.activeGroups.find(g => g.name === groupName)?.id;
      if (!groupId) {
        throw new Error(`Grupo "${groupName}" não encontrado na configuração`);
      }

      await this.page.goto(`https://www.facebook.com/groups/${groupId}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // TODO: Implement real Facebook posting
      // This is still a stub - real implementation needs:
      // 1. Find "Escreva algo..." input
      // 2. Type content with human-like delays
      // 3. Attach image if provided
      // 4. Click "Publicar" button
      // 5. Wait for confirmation
      
      // For now, return fake success
      const postId = `fb_${Date.now()}`;
      
      console.log(`[STUB] Would publish to group ${groupName}:`, content.text.substring(0, 100));
      
      return { success: true, postId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.connection) {
      await this.connection.browser.close();
      this.connection = null;
    }
  }
}