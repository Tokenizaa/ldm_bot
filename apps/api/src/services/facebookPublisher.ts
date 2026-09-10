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

interface SelectorCandidate { selector: string; description: string; }
const COMPOSER_TRIGGER_SELECTORS: SelectorCandidate[] = [
  { selector: 'div[role="button"]:has-text("Escreva algo...")', description: 'role=button text Escreva algo' },
  { selector: 'div[role="button"]:has-text("Write something...")', description: 'role=button text Write something' },
  { selector: 'div[role="button"][aria-label*="Escreva algo"]', description: 'aria-label contains Escreva algo' },
  { selector: 'div[role="button"][aria-label*="Write something"]', description: 'aria-label contains Write something' },
];
const DIALOG_COMPOSER_SELECTORS: SelectorCandidate[] = [
  { selector: 'div[role="dialog"] div[role="textbox"][data-lexical-editor="true"]', description: 'dialog textbox lexical' },
  { selector: 'div[role="dialog"] [aria-placeholder="Crie um post público…"]', description: 'dialog aria-placeholder' },
  { selector: 'div[role="dialog"] [aria-placeholder="Create a public post..."]', description: 'dialog aria-placeholder EN' },
  { selector: 'div[role="dialog"] div[contenteditable="true"][data-lexical-editor="true"]', description: 'dialog contenteditable lexical' },
];
const SUBMIT_BUTTON_SELECTORS: SelectorCandidate[] = [
  { selector: 'div[role="button"][aria-label="Postar"]', description: 'role=button aria-label Postar' },
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
const FACEBOOK_POST_URL_PATTERN = /\/groups\/[^/]+\/(?:posts|permalink)\/[^/?#]+|\/(?:posts|permalink)\/[^/?#]+/;

export class FacebookPublisher {
  private connection: { browser: Browser; context: BrowserContext; isConnected: boolean } | null = null;
  private page: Page | null = null;
  private config: SystemConfig;
  private screenshotsDir: string;

  constructor(config: SystemConfig) {
    this.config = config;
    const __filename = fileURLToPath(import.meta.url);
    const apiRoot = join(dirname(__filename), '..', '..', '..');
    this.screenshotsDir = join(apiRoot, 'screenshots');
  }

  async initialize(): Promise<void> {
    const cdpUrl = `http://localhost:${this.config.system?.cdpPort || 9222}`;
    const browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();
    if (!contexts.length) throw new Error('Nenhum contexto encontrado no Chrome conectado.');
    const context = contexts[0]!;
    this.connection = { browser, context, isConnected: true };

    // Reutilizar página Facebook existente no contexto CDP
    const existingPages = context.pages();
    const fbPage = existingPages.find((p) => p.url().includes('facebook.com'));
    if (fbPage) {
      this.page = fbPage;
      console.log('[FB] Reutilizando página Facebook existente:', this.page.url());
    } else {
      this.page = await context.newPage();
      console.log('[FB] Criada nova página (nenhuma página Facebook encontrada no contexto)');
    }
    await this.setupPage();
  }

  async cleanup(): Promise<void> {
    // Fechar apenas a página que o Publisher criou (se não reutilizou)
    // NÃO fechar o browser CDP compartilhado
    if (this.page && !this.connection?.browser.isConnected()) {
      await this.page.close().catch(() => undefined);
    }
    this.page = null;
    // Não desconectar/fechar o browser CDP — pode estar em uso por outros processos
    this.connection = null;
  }

  async publishPost(content: { text: string; link: string; imageUrl?: string | undefined }, groupName: string): Promise<PublishResult> {
    if (!this.page) throw new Error('Page not initialized');
    const startTime = Date.now();
    const isSafe = this.config.facebook.mode === 'safe';
    const humanLevel = this.config.facebook.humanizationLevel;
    try {
      const groupId = this.config.facebook.activeGroups.find((g) => g.name === groupName || g.id === groupName)?.id;
      if (!groupId) throw new Error(`Grupo "${groupName}" não encontrado na configuração`);
      console.log(`[FB] Navegando para grupo ${groupName} (${groupId})...`);
      await this.page.goto(`https://www.facebook.com/groups/${groupId}`, { waitUntil: isSafe ? 'networkidle' : 'domcontentloaded', timeout: 30000 });
      if (await this.isLoginPage()) {
        const screenshot = await this.screenshot('login-required');
        return { success: false, error: 'Sessão do Facebook não autenticada no Chrome CDP — faça login manualmente no perfil', screenshotPath: screenshot };
      }
      if (isSafe && humanLevel > 40) { await this.randomDelay(800, 2000); await this.scrollPage(this.page, 100, 300); }
      await this.openComposerDialog(this.page);
      const composer = await this.findDialogComposer(this.page);
      if (!composer) return { success: false, error: `Composer no dialog não encontrado: ${DIALOG_COMPOSER_SELECTORS.map((s) => s.description).join(', ')}`, screenshotPath: await this.screenshot('composer-not-found') };
      console.log(`[FB] Composer dialog encontrado`);
      await composer.click({ force: true });
      await this.randomDelay(300, 800);
      const fullText = content.link ? `${content.text}\n\n${content.link}` : content.text;
      await this.typeHumanized(this.page, fullText, humanLevel);
      if (content.imageUrl) await this.attachImage(this.page, content.imageUrl);
      await this.randomDelay(isSafe ? 1000 : 300, isSafe ? 2500 : 800);
      const submitBtn = await this.findWithFallbacks(this.page, SUBMIT_BUTTON_SELECTORS, 'Botão Publicar', this.getTimeout());
      if (!submitBtn) return { success: false, error: `Botão de publicar não encontrado: ${SUBMIT_BUTTON_SELECTORS.map((s) => s.description).join(', ')}`, screenshotPath: await this.screenshot('submit-button-not-found') };
      console.log(`[FB] Clicando publicar: ${submitBtn.matched.description}`);
      const urlBefore = this.page.url();
      await submitBtn.element.click();
      const confirmation = await this.waitPostConfirmation(this.page, fullText, urlBefore, isSafe);
      const screenshot = await this.screenshot(confirmation.success ? 'publish-success' : 'publish-failed');
      if (!confirmation.success) return { success: false, error: confirmation.error, screenshotPath: screenshot };
      const postId = await this.extractRealPostId(this.page);
      if (!postId) {
        return { success: false, error: 'Publicação aparentemente confirmada, mas o ID/permalink real do post não foi localizado; publicação não será marcada como concluída para evitar falso positivo.', screenshotPath: screenshot };
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[FB] Publicação confirmada em ${elapsed}s — postId=${postId}`);
      return { success: true, postId, publishedAt: new Date().toISOString(), screenshotPath: screenshot };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido na publicação', screenshotPath: await this.screenshot('publish-exception') };
    }
  }

  private async extractRealPostId(page: Page): Promise<string | null> {
    const currentUrl = page.url();
    const currentMatch = currentUrl.match(FACEBOOK_POST_URL_PATTERN);
    if (currentMatch) return this.normalizeFacebookPostId(currentUrl);
    const candidates = await page.locator('a[href*="/posts/"], a[href*="/permalink/"]').evaluateAll((anchors) => anchors.map((a) => (a as HTMLAnchorElement).href).filter(Boolean));
    for (const href of candidates) {
      const normalized = this.normalizeFacebookPostId(href);
      if (normalized) return normalized;
    }
    return null;
  }

  private normalizeFacebookPostId(url: string): string | null {
    const match = url.match(FACEBOOK_POST_URL_PATTERN);
    if (!match) return null;
    const parts = match[0].split('/').filter(Boolean);
    const numeric = parts.at(-1);
    return numeric ? numeric : match[0];
  }

  private async findWithFallbacks(page: Page, candidates: SelectorCandidate[], label: string, timeout: number): Promise<{ element: Locator; matched: SelectorCandidate } | null> {
    for (const candidate of candidates) {
      try {
        const locator = page.locator(candidate.selector).first();
        await locator.waitFor({ state: 'visible', timeout: Math.min(timeout, 5000) });
        console.log(`[FB] ${label} OK via: ${candidate.description}`);
        return { element: locator, matched: candidate };
      } catch {}
    }
    console.warn(`[FB] ${label} FALHOU — nenhum seletor visível`);
    return null;
  }

  private async typeHumanized(page: Page, text: string, level: number): Promise<void> {
    if (level < 30) { await page.keyboard.insertText(text); await this.randomDelay(100, 300); return; }
    const baseDelay = this.mapRange(level, 30, 100, 15, 80);
    for (const char of text) {
      await page.keyboard.type(char, { delay: 0 });
      const jitter = baseDelay * (0.6 + Math.random() * 0.8);
      const extra = Math.random() < 0.05 ? baseDelay * (2 + Math.random() * 4) : 0;
      await this.randomDelay(jitter, jitter + extra);
    }
  }

  private async attachImage(page: Page, imageUrl: string): Promise<void> {
    const photoBtn = await this.findWithFallbacks(page, PHOTO_BUTTON_SELECTORS, 'Botão Foto/vídeo', 5000);
    if (photoBtn) { await photoBtn.element.click(); await this.randomDelay(500, 1000); }
    const fileInput = await this.findWithFallbacks(page, FILE_INPUT_SELECTOR, 'File input', 5000);
    if (!fileInput) { console.warn('[FB] File input não encontrado — imagem ignorada'); return; }
    const tmpDir = join(this.screenshotsDir, '_tmp');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    try {
      const response = await page.request.fetch(imageUrl);
      const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[0] || '.jpg';
      const tmpFile = join(tmpDir, `upload_${Date.now()}${ext}`);
      writeFileSync(tmpFile, await response.body());
      await fileInput.element.setInputFiles(tmpFile);
      console.log(`[FB] Imagem anexada: ${imageUrl.substring(0, 80)}`);
      await this.randomDelay(2000, 4000);
    } catch (err) { console.warn(`[FB] Falha ao anexar imagem: ${err instanceof Error ? err.message : 'erro desconhecido'}`); }
  }

  private async isLoginPage(): Promise<boolean> {
    if (!this.page) return false;
    const url = this.page.url();
    if (LOGIN_URL_PATTERNS.some((p) => url.includes(p))) return true;
    try { return await this.page.locator('input[name="email"], input[id="email"]').isVisible({ timeout: 2000 }); } catch { return false; }
  }

  private async waitPostConfirmation(page: Page, postText: string, urlBeforeSubmit: string, isSafe: boolean): Promise<{ success: boolean; error?: string }> {
    const timeout = isSafe ? 25000 : 20000;
    const shortText = postText.substring(0, 50).trim();
    try {
      await page.waitForURL((url) => url.toString() !== urlBeforeSubmit && /(\/posts\/|\/permalink\/|\/groups\/[^/]+\/permalink\/)/.test(url.toString()), { timeout: Math.min(timeout, 10000) });
      return { success: true };
    } catch {}
    try {
      await page.waitForFunction((searchText: string) => { const composer = document.querySelector('div[role="textbox"][data-lexical-editor="true"]'); if (composer && composer.textContent?.includes(searchText)) return false; return true; }, shortText, { timeout: Math.min(timeout, 8000) });
    } catch {
      try { const errorDialog = page.locator('[role="alert"], [aria-live="assertive"]').first(); if (await errorDialog.isVisible({ timeout: 2000 })) return { success: false, error: `Facebook retornou erro: ${await errorDialog.textContent()}` }; } catch {}
      return { success: false, error: 'Composer não submeteu — texto ainda presente após clique em Publicar' };
    }
    try {
      await page.waitForFunction((searchText: string) => { const posts = document.querySelectorAll('[data-ad-rendering-role="story_message"], [data-ad-preview="message"], div[role="article"]'); for (const post of posts) if (post.textContent?.includes(searchText)) return true; return document.body.innerText.includes(searchText); }, shortText, { timeout });
      return { success: true };
    } catch { return { success: false, error: 'Confirmação pós-publicação não detectada — post pode não ter sido publicado' }; }
  }

  private async screenshot(label: string): Promise<string | undefined> {
    if (!this.page) return undefined;
    try { if (!existsSync(this.screenshotsDir)) mkdirSync(this.screenshotsDir, { recursive: true }); const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); const filepath = join(this.screenshotsDir, `${label}_${timestamp}.png`); await this.page.screenshot({ path: filepath, fullPage: false }); return filepath; } catch { return undefined; }
  }

  private async setupPage(): Promise<void> { if (!this.page) return; await this.page.setViewportSize({ width: 1920, height: 1080 }); await this.page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' }); this.page.setDefaultTimeout(this.getTimeout()); }
  private getTimeout(): number { return 30000; }
  private async randomDelay(minMs: number, maxMs: number): Promise<void> { const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs; await new Promise((resolve) => setTimeout(resolve, ms)); }
  private async scrollPage(page: Page, minY: number, maxY: number): Promise<void> { await page.mouse.wheel(0, Math.floor(Math.random() * (maxY - minY + 1)) + minY); await this.randomDelay(200, 600); }
  private mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number { return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin; }

  private async openComposerDialog(page: Page): Promise<void> {
    const trigger = await this.findWithFallbacks(page, COMPOSER_TRIGGER_SELECTORS, 'Botão Escreva algo', this.getTimeout());
    if (!trigger) throw new Error('Botão "Escreva algo..." não encontrado — nenhum seletor funcionou');
    await trigger.element.click({ force: true });
    await page.waitForSelector('div[role="dialog"] >> text="Criar post"', { state: 'visible', timeout: this.getTimeout() });
  }

  private async findDialogComposer(page: Page): Promise<Locator | null> {
    const composer = await this.findWithFallbacks(page, DIALOG_COMPOSER_SELECTORS, 'Composer no dialog', this.getTimeout());
    return composer?.element ?? null;
  }
}
