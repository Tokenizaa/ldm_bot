import { chromium, BrowserContext, Page } from 'playwright';

let context: BrowserContext | null = null;

export async function getBrowser(): Promise<BrowserContext> {
  if (context) return context;

  context = await chromium.launchPersistentContext('./browser-data', {
    headless: false,
    channel: 'chrome',
    viewport: {
      width: 1366,
      height: 768
    }
  });

  return context;
}

export async function newPage(): Promise<Page> {
  const browser = await getBrowser();
  return browser.newPage();
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(min: number = 2000, max: number = 5000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}
