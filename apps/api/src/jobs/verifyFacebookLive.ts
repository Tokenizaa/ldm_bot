import { chromium } from 'playwright';
import { loadConfig } from '../config/configStore.js';

const main = async () => {
  const config = await loadConfig();
  const port = config.system?.cdpPort || 9222;
  const browser = await chromium.connectOverCDP(`http://localhost:${port}`);

  const contexts = browser.contexts();
  if (!contexts.length) throw new Error('NO_BROWSER_CONTEXT');

  const context = contexts[0]!;
  const pages = context.pages();
  const facebookPages = pages.filter((page) => page.url().includes('facebook.com'));
  const page = facebookPages[0] ?? pages[0];
  if (!page) throw new Error('NO_PAGE');

  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  const title = await page.title().catch(() => '');
  const url = page.url();
  const loginRequired =
    /\/login|\/checkpoint|\/recover|two_step_verification/.test(url) ||
    await page
      .locator('input[name="email"], input[id="email"]')
      .isVisible({ timeout: 1500 })
      .catch(() => false);

  const result = {
    success: !loginRequired,
    cdp: true,
    contextPages: pages.length,
    facebookPages: facebookPages.length,
    url,
    title,
    authenticated: !loginRequired,
  };

  console.log(JSON.stringify(result, null, 2));
  if (loginRequired) process.exitCode = 2;
};

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
