import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';
import type { SystemConfig } from '@forge-deals/shared/types/config';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface PublishResult {
  success: boolean;
  postId?: string | undefined;
  error?: string | undefined;
  screenshotPath?: string | undefined;
  publishedAt?: string | undefined;
}

interface SelectorCandidate {
  selector: string;
  description: string;
}

// ── Selector banks: multiple fallbacks per step ──────────────────────
const COMPOSER_SELECTORS: SelectorCandidate[] = [
  { selector: 'div[role="textbox"][data-lexical-editor="true"]', description: 'role=textbox + lexical' },
  { selector: '[aria-label="Escreva algo..."]', description: 'aria-label Escreva algo' },
  { selector: '[aria-label="Write something..."]', description: 'aria-label Write something' },
  { selector: 'div[contenteditable="true"][data-lexical-editor="true"]', description: 'contenteditable lexical' },
  { selector: 'div[contenteditable="true"][role="textbox"]', description: 'contenteditable role=textbox' },
  { selector: 'form[aria-label] div[contenteditable="true"]', description: 'form contenteditable' },
];

const SUBMIT_BUTTON_SELECTORS: SelectorCandidate[] = [
  { selector: '[aria-label="Publicar"]', description: 'aria-label Publicar' },
  { selector: '[aria-label="Post"]', description: 'aria-label Post' },
  { selector: '[aria-label="Publicar no grupo"]', description: 'aria-label Publicar no grupo' },
  { selector: 'div[role="button"][aria-label*="ublicar"]', description: 'role=button + label contains ublicar' },
  { selector: 'div[role="button"][aria-label*="ost"]', description: 'role=button + label contains ost' },
];

const FILE_INPUT_SELECTOR: SelectorCandidate[] = [
  { selector: 'input[type="file"][accept*="image"]', description: 'file input accept image' },
  { selector: 'input[type="file"][accept*="video"]', description: 'file input accept video' },
  { selector: 'input[type="file"][name*="file"]', description: 'file input name contains file' },
  { selector: 'input[type="file"]', description: 'any file input' },
];

const PHOTO_BUTTON_SELECTORS: SelectorCandidate[] = [
  { selector: '[aria-label="Foto/vídeo"]', description: 'aria-label Foto/vídeo' },
  { selector: '[aria-label="Photo/video"]', description: 'aria-label Photo/video' },
  { selector: '[aria-label="Foto"]', description: 'aria-label Foto' },
];

const LOGIN_URL_PATTERNS = ['/login', '/checkpoint', '/two_step_verification', '/recover'];

export class FacebookPublisher {
  private connection: { browser: Browser; context: BrowserContext; isConnected: boolean } | null = null;
  private page: Page | null = null;
  private config: SystemConfig;
  private screenshotsDir: string;

  constructor(config: SystemConfig) {
    this.config = config;
    // Resolve screenshots dir relative to this file's package root
    const __filename = fileURLToPath(import.meta.url);
    const apiRoot = join(dirname(__filename), '..', '..', '..');
    this.screenshotsDir = join(apiRoot, 'screenshots');
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    const cdpUrl = `http://localhost:${this.config.system?.cdpPort || 9222}`;
    const browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();

    if (!contexts.length) {
      throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    }

    const context = contexts[0]!;

    this.connection = {
      browser,
      context,
      isConnected: true,
    };

    this.page = await context.newPage();
    await this.setupPage();
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => undefined);
      this.page = null;
    }
    if (this.connection) {
      await this.connection.browser.close().catch(() => undefined);
      this.connection = null;
    }
  }

  // ── Core publish flow ──────────────────────────────────────────────

  async publishPost(
    content: { text: string; link: string; imageUrl?: string | undefined },
    groupName: string,
  ): Promise<PublishResult> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    const isSafe = this.config.facebook.mode === 'safe';
    const humanLevel = this.config.facebook.humanizationLevel; // 0-100

    try {
      // 1. Resolve group ID
      const groupId = this.config.facebook.activeGroups.find(
        (g) => g.name === groupName || g.id === groupName,
      )?.id;
      if (!groupId) {
        throw new Error(`Grupo "${groupName}" não encontrado na configuração`);
      }

      // 2. Navigate to group
      console.log(`[FB] Navegando para grupo ${groupName} (${groupId})...`);
      await this.page.goto(`https://www.facebook.com/groups/${groupId}`, {
        waitUntil: isSafe ? 'networkidle' : 'domcontentloaded',
        timeout: 30000,
      });

      // 3. Check login state
      if (await this.isLoginPage()) {
        const screenshot = await this.screenshot('login-required');
        return {
          success: false,
          error: 'Sessão do Facebook não autenticada no Chrome CDP — faça login manualmente no perfil',
          screenshotPath: screenshot,
        };
      }

      // Optional humanization: scroll before interacting (safe mode)
      if (isSafe && humanLevel > 40) {
        await this.randomDelay(800, 2000);
        await this.scrollPage(this.page, 100, 300);
      }

      // 4. Find and open composer
      const composer = await this.findWithFallbacks(
        this.page,
        COMPOSER_SELECTORS,
        `Composer (${groupName})`,
        this.getTimeout(),
      );
      if (!composer) {
        const screenshot = await this.screenshot('composer-not-found');
        return {
          success: false,
          error: `Composer não encontrado — nenhum seletor funcionou: ${COMPOSER_SELECTORS.map((s) => s.description).join(', ')}`,
          screenshotPath: screenshot,
        };
      }

      console.log(`[FB] Composer encontrado: ${composer.matched.description}`);
      await composer.element.click();
      await this.randomDelay(300, 800);

      // 5. Type content with humanization
      const fullText = content.link
        ? `${content.text}\n\n${content.link}`
        : content.text;
      await this.typeHumanized(this.page, fullText, humanLevel);

      // 6. Attach image if provided
      if (content.imageUrl) {
        await this.attachImage(this.page, content.imageUrl);
      }

      // 7. Small delay before posting
      if (isSafe) {
        await this.randomDelay(1000, 2500);
      } else {
        await this.randomDelay(300, 800);
      }

      // 8. Click submit
      const submitBtn = await this.findWithFallbacks(
        this.page,
        SUBMIT_BUTTON_SELECTORS,
        'Botão Publicar',
        this.getTimeout(),
      );
      if (!submitBtn) {
        const screenshot = await this.screenshot('submit-button-not-found');
        return {
          success: false,
          error: `Botão de publicar não encontrado: ${SUBMIT_BUTTON_SELECTORS.map((s) => s.description).join(', ')}`,
          screenshotPath: screenshot,
        };
      }

      console.log(`[FB] Clicando publicar: ${submitBtn.matched.description}`);
      const urlBefore = this.page.url();
      await submitBtn.element.click();

      // 9. Confirmation wait — real, never fake
      const confirmation = await this.waitPostConfirmation(this.page, fullText, urlBefore, isSafe);

      const screenshot = await this.screenshot(confirmation.success ? 'publish-success' : 'publish-failed');

      if (confirmation.success) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[FB] Publicação confirmada em ${elapsed}s`);
        return {
          success: true,
          postId: `fb_${Date.now()}`,
          publishedAt: new Date().toISOString(),
          screenshotPath: screenshot,
        };
      }

      return {
        success: false,
        error: confirmation.error,
        screenshotPath: screenshot,
      };
    } catch (error) {
      const screenshot = await this.screenshot('publish-exception');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na publicação',
        screenshotPath: screenshot,
      };
    }
  }

  // ── Selector lookup with fallbacks ─────────────────────────────────

  private async findWithFallbacks(
    page: Page,
    candidates: SelectorCandidate[],
    label: string,
    timeout: number,
  ): Promise<{ element: Locator; matched: SelectorCandidate } | null> {
    for (const candidate of candidates) {
      try {
        const locator = page.locator(candidate.selector).first();
        await locator.waitFor({ state: 'visible', timeout: Math.min(timeout, 5000) });
        console.log(`[FB] ${label} OK via: ${candidate.description}`);
        return { element: locator, matched: candidate };
      } catch {
        // try next candidate
      }
    }
    console.warn(`[FB] ${label} FALHOU — nenhum seletor visível`);
    return null;
  }

  // ── Typing humanization ────────────────────────────────────────────

  private async typeHumanized(page: Page, text: string, level: number): Promise<void> {
    if (level < 30) {
      // Low humanization: fast paste
      await page.keyboard.insertText(text);
      await this.randomDelay(100, 300);
      return;
    }

    // Character-by-character typing with jitter
    const baseDelay = this.mapRange(level, 30, 100, 15, 80); // ms per char
    for (const char of text) {
      await page.keyboard.type(char, { delay: 0 });
      // Jitter: +/- 40% of base delay
      const jitter = baseDelay * (0.6 + Math.random() * 0.8);
      // Occasional longer pause (simulates thinking) — ~5% chance
      const extra = Math.random() < 0.05 ? baseDelay * (2 + Math.random() * 4) : 0;
      await this.randomDelay(jitter, jitter + extra);
    }
  }

  // ── Image attachment ───────────────────────────────────────────────

  private async attachImage(page: Page, imageUrl: string): Promise<void> {
    // Try clicking the photo/video button first to expose the file input
    const photoBtn = await this.findWithFallbacks(
      page,
      PHOTO_BUTTON_SELECTORS,
      'Botão Foto/vídeo',
      5000,
    );
    if (photoBtn) {
      await photoBtn.element.click();
      await this.randomDelay(500, 1000);
    }

    // Find file input
    const fileInput = await this.findWithFallbacks(
      page,
      FILE_INPUT_SELECTOR,
      'File input',
      5000,
    );
    if (!fileInput) {
      console.warn('[FB] File input não encontrado — imagem ignorada');
      return;
    }

    // Download image to temp, then set via setInputFiles
    // For URLs: use Playwright's API request to download first
    const tmpDir = join(this.screenshotsDir, '_tmp');
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }

    try {
      const response = await page.request.fetch(imageUrl);
      const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[0] || '.jpg';
      const tmpFile = join(tmpDir, `upload_${Date.now()}${ext}`);
      const buffer = await response.body();
      writeFileSync(tmpFile, buffer);
      await fileInput.element.setInputFiles(tmpFile);
      console.log(`[FB] Imagem anexada: ${imageUrl.substring(0, 80)}`);

      // Wait for upload preview
      await this.randomDelay(2000, 4000);
    } catch (err) {
      console.warn(`[FB] Falha ao anexar imagem: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
    }
  }

  // ── Login detection ────────────────────────────────────────────────

  private async isLoginPage(): Promise<boolean> {
    if (!this.page) return false;
    const url = this.page.url();
    if (LOGIN_URL_PATTERNS.some((p) => url.includes(p))) {
      console.warn(`[FB] Login page detectada: ${url}`);
      return true;
    }
    // Check for login form elements
    try {
      const emailInput = this.page.locator('input[name="email"], input[id="email"]');
      const isVisible = await emailInput.isVisible({ timeout: 2000 });
      if (isVisible) {
        console.warn('[FB] Input de email detectado — possível tela de login');
        return true;
      }
    } catch {
      // Not on login page
    }
    return false;
  }

  // ── Post confirmation ──────────────────────────────────────────────

  private async waitPostConfirmation(
    page: Page,
    postText: string,
    urlBeforeSubmit: string,
    isSafe: boolean,
  ): Promise<{ success: boolean; error?: string | undefined }> {
    const timeout = isSafe ? 25000 : 20000;
    const shortText = postText.substring(0, 50).trim();

    // Stage 1 — URL redirect pós-publicação (ex. /posts/ ou /permalink/)
    try {
      await page.waitForURL(
        (url) => url.toString() !== urlBeforeSubmit && /(\/posts\/|\/permalink\/|\/groups\/[^/]+\/permalink\/)/.test(url.toString()),
        { timeout: Math.min(timeout, 10000) },
      );
      console.log('[FB] Confirmação via redirect de URL');
      return { success: true };
    } catch {
      // no redirect — group feeds stay on same URL, follow feed check
    }

    // Stage 2a — composer precisa esvaziar/fechar (texto foi submetido)
    try {
      await page.waitForFunction(
        (searchText: string) => {
          const composer = document.querySelector('div[role="textbox"][data-lexical-editor="true"]');
          if (composer && composer.textContent?.includes(searchText)) return false;
          return true;
        },
        shortText,
        { timeout: Math.min(timeout, 8000) },
      );
    } catch {
      // Composer não submeteu — texto ainda presente
      try {
        const errorDialog = page.locator('[role="alert"], [aria-live="assertive"]').first();
        if (await errorDialog.isVisible({ timeout: 2000 })) {
          const errorText = await errorDialog.textContent();
          return { success: false, error: `Facebook retornou erro: ${errorText}` };
        }
      } catch {
        // no dialog
      }
      return { success: false, error: 'Composer não submeteu — texto ainda presente após clique em Publicar' };
    }

    // Stage 2b — post visível no feed (fora do composer)
    try {
      await page.waitForFunction(
        (searchText: string) => {
          const posts = document.querySelectorAll(
            '[data-ad-rendering-role="story_message"], [data-ad-preview="message"], div[role="article"]',
          );
          for (const post of posts) {
            if (post.textContent?.includes(searchText)) return true;
          }
          // Fallback: composer já limpo — texto no body só pode vir de post publicado
          return document.body.innerText.includes(searchText);
        },
        shortText,
        { timeout },
      );
      console.log('[FB] Confirmação via post visível no feed');
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Confirmação pós-publicação não detectada — post pode não ter sido publicado',
      };
    }
  }

  // ── Screenshot evidence ────────────────────────────────────────────

  private async screenshot(label: string): Promise<string | undefined> {
    if (!this.page) return undefined;
    try {
      if (!existsSync(this.screenshotsDir)) {
        mkdirSync(this.screenshotsDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${label}_${timestamp}.png`;
      const filepath = join(this.screenshotsDir, filename);
      await this.page.screenshot({ path: filepath, fullPage: false });
      console.log(`[FB] Screenshot: ${filepath}`);
      return filepath;
    } catch (err) {
      console.warn(`[FB] Falha screenshot: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
      return undefined;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private async setupPage(): Promise<void> {
    if (!this.page) return;
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    });
    this.page.setDefaultTimeout(this.getTimeout());
  }

  private getTimeout(): number {
    return 30000;
  }

  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async scrollPage(page: Page, minY: number, maxY: number): Promise<void> {
    const pixels = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    await page.mouse.wheel(0, pixels);
    await this.randomDelay(200, 600);
  }

  private mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }
}
