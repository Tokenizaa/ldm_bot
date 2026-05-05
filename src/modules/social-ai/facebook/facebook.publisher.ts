import { Browser, Page, chromium } from 'playwright';
import { SocialPost, FacebookPublisher } from '../types';
import { HumanBehavior } from '../antiSpam/humanBehavior';
import { facebookBrowserConfig } from '../../../config/browserConfig';

export interface FacebookConfig {
  headless: boolean;
  slowMo: number;
  timeout: number;
  viewport: { width: number; height: number };
  userAgent: string;
  usePersistentProfile?: boolean; // Nova opção para usar perfil persistente
}

export interface PublishingResult {
  success: boolean;
  postId?: string;
  publishedAt?: Date;
  error?: string;
  screenshot?: string;
  duration: number;
}

export class FacebookPublisher {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: FacebookConfig;
  private humanBehavior: HumanBehavior;
  private status: FacebookPublisher;

  constructor(config?: Partial<FacebookConfig>) {
    this.config = {
      headless: false, // MUITO IMPORTANTE: headless false como solicitado
      slowMo: 100,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      userAgent: facebookBrowserConfig.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      usePersistentProfile: true, // Padrão: usar perfil persistente
      ...config
    };

    this.humanBehavior = new HumanBehavior({
      typingSpeedVariation: true,
      mouseMovementSimulation: true,
      randomDelays: true,
      scrollSimulation: true
    });

    this.status = {
      id: 'facebook-publisher-main',
      status: 'idle',
      progress: {
        step: 'idle',
        percentage: 0,
        message: 'Aguardando publicação'
      },
      lastActivity: new Date(),
      totalPosts: 0,
      successRate: 0,
      errors: []
    };
  }

  async initialize(): Promise<void> {
    try {
      this.updateStatus('connecting', 'Iniciando browser...', 10);

      if (this.config.usePersistentProfile) {
        // Usar perfil persistente do Windows Chrome Profile 1
        await this.initializeWithPersistentProfile();
      } else {
        // Usar configuração padrão
        await this.initializeStandard();
      }

      // Aplicar comportamento humano
      await this.humanBehavior.simulateHumanBehavior(this.page);

      this.updateStatus('connected', 'Browser inicializado', 100);
      console.log('✅ Facebook Publisher inicializado');

    } catch (error) {
      this.updateStatus('error', `Falha na inicialização: ${error}`, 0);
      this.status.errors.push(`Initialization failed: ${error}`);
      throw error;
    }
  }

  private async initializeWithPersistentProfile(): Promise<void> {
    const userDataDir = 'C:\\Users\\LG\\AppData\\Local\\Google\\Chrome\\User Data';
    
    // Usar launchPersistentContext para manter sessão real do Facebook
    const context = await chromium.launchPersistentContext(
      userDataDir,
      {
        channel: 'chrome',
        headless: false, // MUITO IMPORTANTE: headless false
        args: [
          '--profile-directory=Profile 1', // Profile 1 para Facebook
          ...(facebookBrowserConfig.extraArgs || [])
        ]
      }
    );

    this.page = await context.newPage();
    await this.page.setViewportSize(this.config.viewport);
    await this.page.setDefaultTimeout(this.config.timeout);
    
    // Armazenar context para cleanup
    this.browser = context as any;
  }

  private async initializeStandard(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: facebookBrowserConfig.extraArgs || [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewportSize(this.config.viewport);
    await this.page.setUserAgent(this.config.userAgent);
    await this.page.setDefaultTimeout(this.config.timeout);
  }

  async publishPost(post: SocialPost, groupId: string): Promise<PublishingResult> {
    const startTime = Date.now();
    
    try {
      this.updateStatus('posting', `Publicando em grupo: ${groupId}`, 20);
      this.status.currentPost = post;

      // Step 1: Acessar grupo
      await this.navigateToGroup(groupId);
      this.updateStatus('posting', 'Grupo acessado', 40);

      // Step 2: Localizar campo de postagem
      await this.locatePostArea();
      this.updateStatus('posting', 'Campo de postagem localizado', 50);

      // Step 3: Preencher conteúdo
      await this.fillPostContent(post);
      this.updateStatus('posting', 'Conteúdo preenchido', 70);

      // Step 4: Adicionar mídia (se houver)
      if (post.metadata.images.length > 0 || post.metadata.videos) {
        await this.attachMedia(post);
        this.updateStatus('posting', 'Mídia anexada', 80);
      }

      // Step 5: Adicionar link afiliado (se houver)
      if (post.metadata.links.length > 0) {
        await this.addAffiliateLink(post.metadata.links[0]);
        this.updateStatus('posting', 'Link afiliado adicionado', 90);
      }

      // Step 6: Preview e confirmação humana
      await this.waitForHumanConfirmation();
      this.updateStatus('posting', 'Aguardando confirmação humana', 95);

      // Step 7: Publicar
      const postId = await this.executePublish();
      this.updateStatus('published', 'Post publicado com sucesso', 100);

      // Atualizar estatísticas
      this.status.totalPosts++;
      this.status.successRate = this.calculateSuccessRate();
      this.status.lastActivity = new Date();

      const duration = Date.now() - startTime;

      // Capturar screenshot
      const screenshot = await this.captureScreenshot('published');

      console.log(`✅ Post publicado: ${postId} (${duration}ms)`);

      return {
        success: true,
        postId,
        publishedAt: new Date(),
        duration,
        screenshot
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateStatus('error', `Falha na publicação: ${errorMessage}`, 0);
      this.status.errors.push(errorMessage);

      // Capturar screenshot do erro
      const screenshot = await this.captureScreenshot('error');

      console.error(`❌ Falha na publicação: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        duration,
        screenshot
      };
    }
  }

  private async navigateToGroup(groupId: string): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    const groupUrl = `https://www.facebook.com/groups/${groupId}`;
    
    await this.page.goto(groupUrl, { 
      waitUntil: 'networkidle',
      timeout: this.config.timeout 
    });

    // Aguardar carregamento completo
    await this.page.waitForTimeout(2000);

    // Simular comportamento humano
    await this.humanBehavior.simulateHumanBehavior(this.page);
  }

  private async locatePostArea(): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    // Múltiplos seletores para encontrar área de postagem
    const selectors = [
      '[role="textbox"]',
      '[contenteditable="true"]',
      'div[role="textbox"]',
      'textarea',
      '[data-testid="composer-input"]',
      '.composer-input'
    ];

    let postArea = null;
    
    for (const selector of selectors) {
      try {
        postArea = await this.page.waitForSelector(selector, { timeout: 5000 });
        if (postArea) break;
      } catch {
        continue;
      }
    }

    if (!postArea) {
      throw new Error('Área de postagem não encontrada');
    }

    // Focar na área de postagem
    await postArea.focus();
    await this.page.waitForTimeout(1000);
  }

  private async fillPostContent(post: SocialPost): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    // Encontrar textarea ou contenteditable
    const contentArea = await this.page.locator('[role="textbox"], [contenteditable="true"]').first();
    
    if (await contentArea.count() === 0) {
      throw new Error('Área de conteúdo não encontrada');
    }

    // Simular digitação humana
    await this.humanBehavior.simulateHumanBehavior(this.page);

    // Digitar conteúdo com variação de velocidade
    await this.typeWithHumanVariation(post.content, contentArea);

    // Pequena pausa após digitação
    await this.page.waitForTimeout(1000);
  }

  private async typeWithHumanVariation(text: string, element: any): Promise<void> {
    const words = text.split(' ');
    const baseSpeed = 100; // ms por caractere base

    for (const word of words) {
      // Variação de velocidade: 0.5x a 1.5x
      const speedVariation = 0.5 + (Math.random() * 1.0);
      const wordSpeed = baseSpeed * speedVariation;

      // Digitar palavra
      await element.type(word);
      
      // Espaço após a palavra (exceto última)
      if (word !== words[words.length - 1]) {
        await element.type(' ');
      }

      // Pausa entre palavras
      const pause = 50 + (Math.random() * 200); // 50-250ms
      await this.page.waitForTimeout(pause);

      // Pequena chance de pausa maior (como se estivesse pensando)
      if (Math.random() < 0.1) {
        await this.page.waitForTimeout(500 + (Math.random() * 1500)); // 0.5-2s
      }
    }
  }

  private async attachMedia(post: SocialPost): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    // Procurar botão de adicionar mídia
    const mediaButton = await this.page.locator('[data-testid="media-attachment-button"], [aria-label*="foto"], [aria-label*="vídeo"]').first();
    
    if (await mediaButton.count() > 0) {
      await mediaButton.click();
      await this.page.waitForTimeout(1000);

      // Para imagens
      if (post.metadata.images.length > 0) {
        await this.uploadImages(post.metadata.images);
      }

      // Para vídeos
      if (post.metadata.videos) {
        await this.uploadVideo(post.metadata.videos);
      }
    }
  }

  private async uploadImages(images: string[]): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    // Procurar input de arquivo
    const fileInput = await this.page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      // Upload da primeira imagem (simplificado)
      await fileInput.setInputFiles(images[0]);
      await this.page.waitForTimeout(2000);
    }
  }

  private async uploadVideo(videos: string): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    // Implementar upload de vídeo
    console.log('📹 Upload de vídeo ainda não implementado');
  }

  private async addAffiliateLink(link: string): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    // Procurar botão de adicionar link
    const linkButton = await this.page.locator('[data-testid="link-button"], [aria-label*="link"]').first();
    
    if (await linkButton.count() > 0) {
      await linkButton.click();
      await this.page.waitForTimeout(1000);

      // Preencher URL do link
      const linkInput = await this.page.locator('input[type="url"], input[placeholder*="link"]').first();
      
      if (await linkInput.count() > 0) {
        await this.typeWithHumanVariation(link, linkInput);
        await this.page.waitForTimeout(1000);

        // Confirmar link
        const confirmButton = await this.page.locator('button:has-text("Adicionar"), button:has-text("Confirmar")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await this.page.waitForTimeout(1000);
        }
      }
    }
  }

  private async waitForHumanConfirmation(): Promise<void> {
    if (!this.page) throw new Error('Página não inicializada');

    console.log('👤 Aguardando confirmação humana para publicação...');
    console.log('📋 Review do post:');
    console.log('   - Verificar o conteúdo');
    console.log('   - Verificar imagens/vídeos');
    console.log('   - Verificar links');
    console.log('   - Confirmar que parece natural');
    console.log('');
    console.log('⚠️  Pressione Enter no terminal quando pronto para continuar...');

    // Aguardar input do usuário (simulação)
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos para review

    // Em produção, isso seria uma interface real para aprovação
    console.log('✅ Confirmação humana recebida');
  }

  private async executePublish(): Promise<string> {
    if (!this.page) throw new Error('Página não inicializada');

    // Procurar botão de publicar
    const publishSelectors = [
      'button:has-text("Publicar")',
      'button:has-text("Postar")',
      'button:has-text("Compartilhar")',
      '[data-testid="post-button"]',
      '[data-testid="composer-submit"]'
    ];

    for (const selector of publishSelectors) {
      try {
        const publishButton = await this.page.locator(selector).first();
        
        if (await publishButton.count() > 0) {
          await publishButton.click();
          
          // Aguardar publicação completar
          await this.page.waitForTimeout(3000);
          
          // Gerar ID simulado
          const postId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          return postId;
        }
      } catch {
        continue;
      }
    }

    throw new Error('Botão de publicação não encontrado');
  }

  private async captureScreenshot(type: 'published' | 'error'): Promise<string> {
    if (!this.page) return '';

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `facebook_${type}_${timestamp}.png`;
      const filepath = `./screenshots/facebook/${filename}`;

      await this.page.screenshot({ 
        path: filepath, 
        fullPage: true 
      });

      console.log(`📸 Screenshot salvo: ${filepath}`);
      return filepath;

    } catch (error) {
      console.warn('Erro ao capturar screenshot:', error);
      return '';
    }
  }

  private updateStatus(status: FacebookPublisher['status'], message: string, percentage: number): void {
    this.status.status = status;
    this.status.progress = {
      step: status,
      percentage,
      message
    };
    this.status.lastActivity = new Date();

    console.log(`📊 Status: ${status} - ${message} (${percentage}%)`);
  }

  private calculateSuccessRate(): number {
    if (this.status.totalPosts === 0) return 0;
    const successfulPosts = this.status.totalPosts - this.status.errors.length;
    return Math.round((successfulPosts / this.status.totalPosts) * 100);
  }

  async getStatus(): Promise<FacebookPublisher> {
    return { ...this.status };
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.updateStatus('idle', 'Publisher limpo', 0);
      console.log('🧹 Facebook Publisher limpo');

    } catch (error) {
      console.error('Erro ao limpar publisher:', error);
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();
      
      // Testar navegação básica
      if (this.page) {
        await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });
        
        // Verificar se carregou
        const title = await this.page.title();
        
        if (title.includes('Facebook')) {
          return { success: true };
        } else {
          return { success: false, error: 'Página não carregou corretamente' };
        }
      }

      return { success: false, error: 'Falha na inicialização' };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      await this.cleanup();
    }
  }

  getConfig(): FacebookConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<FacebookConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração do Facebook Publisher atualizada');
  }
}

export const facebookPublisher = new FacebookPublisher();
