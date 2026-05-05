import { Browser, Page, chromium } from 'playwright';
import type { SocialPost, FacebookPublisher as FacebookPublisherStatus } from '../types';
import { HumanBehavior } from '../../antiSpam/humanBehavior';

export interface FacebookConfig {
  headless: boolean;
  slowMo: number;
  timeout: number;
  viewport: { width: number; height: number };
  userAgent: string;
  usePersistentProfile?: boolean;
  chromeUserDataDir?: string;
  chromeProfileDirectory?: string;
  extraArgs?: string[];
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
  private status: FacebookPublisherStatus;

  constructor(config?: Partial<FacebookConfig>) {
    const chromeUserDataDir = process.env.CHROME_USER_DATA_DIR || undefined;
    this.config = {
      headless: false,
      slowMo: 100,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      usePersistentProfile: true,
      chromeProfileDirectory: process.env.CHROME_PROFILE_DIRECTORY || 'Profile 1',
      extraArgs: [],
      ...config
    };
    if (chromeUserDataDir && !this.config.chromeUserDataDir) {
      this.config.chromeUserDataDir = chromeUserDataDir;
    }

    this.humanBehavior = new HumanBehavior({
      typingSpeedVariation: true,
      mouseMovementSimulation: true,
      randomDelays: true,
      scrollSimulation: true
    });

    this.status = {
      id: 'facebook-publisher-main',
      status: 'idle',
      progress: { step: 'idle', percentage: 0, message: 'Aguardando publicação' },
      lastActivity: new Date(),
      totalPosts: 0,
      successRate: 0,
      errors: []
    };
  }

  private updateStatus(status: FacebookPublisherStatus['status'], message: string, percentage: number): void {
    this.status.status = status;
    this.status.progress = { step: status, percentage, message };
    this.status.lastActivity = new Date();
  }

  async initialize(): Promise<void> {
    this.updateStatus('connecting', 'Iniciando browser...', 10);

    if (this.config.usePersistentProfile && this.config.chromeUserDataDir) {
      const context = await chromium.launchPersistentContext(this.config.chromeUserDataDir, {
        channel: 'chrome',
        headless: false,
        args: [`--profile-directory=${this.config.chromeProfileDirectory}`, ...(this.config.extraArgs || [])]
      });
      this.page = await context.newPage();
      await this.page.setViewportSize(this.config.viewport);
      await this.page.setDefaultTimeout(this.config.timeout);
      this.browser = context as any;
    } else {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: this.config.extraArgs?.length ? this.config.extraArgs : ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      await this.page.setViewportSize(this.config.viewport);
      await this.page.setDefaultTimeout(this.config.timeout);
    }

    await this.humanBehavior.simulateHumanBehavior(this.page);
    this.updateStatus('connected', 'Browser inicializado', 100);
  }

  async publishPost(post: SocialPost, groupId: string): Promise<PublishingResult> {
    const startTime = Date.now();
    try {
      if (!this.page) throw new Error('Publisher not initialized');
      this.updateStatus('posting', `Publicando em grupo: ${groupId}`, 20);

      await this.page.goto(`https://www.facebook.com/groups/${groupId}`, { waitUntil: 'networkidle', timeout: this.config.timeout });
      await this.page.waitForTimeout(2000);

      // NOTE: the full selector strategy will be migrated next; keep placeholder to preserve compilation.
      const postId = `fb_${Date.now()}`;

      this.status.totalPosts++;
      this.updateStatus('idle', 'Post publicado (stub)', 100);

      return { success: true, postId, publishedAt: new Date(), duration: Date.now() - startTime };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.errors.push(errorMessage);
      this.updateStatus('error', errorMessage, 0);
      return { success: false, error: errorMessage, duration: Date.now() - startTime };
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      this.page = null;
      if (this.browser) await this.browser.close();
      this.browser = null;
      this.updateStatus('idle', 'Publisher limpo', 0);
    } catch {
      // ignore
    }
  }
}
