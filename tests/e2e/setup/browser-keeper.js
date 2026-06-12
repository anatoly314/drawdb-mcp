'use strict';

const { chromium } = require('playwright');

const wsEndpoint = process.env.BROWSER_WS_ENDPOINT;
const guiUrl = process.env.GUI_URL;
const readyToken = process.env.READY_TOKEN || 'KEEPER_READY';

if (!wsEndpoint || !guiUrl) {
  process.stderr.write('[keeper] BROWSER_WS_ENDPOINT and GUI_URL are required\n');
  process.exit(2);
}

let browser = null;
let context = null;
let page = null;
let shuttingDown = false;

async function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (context) {
      await context.close().catch(() => {});
    }
  } catch {}
  try {
    if (browser) {
      await browser.close().catch(() => {});
    }
  } catch {}
  process.exit(code);
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));

(async () => {
  try {
    browser = await chromium.connect(wsEndpoint);
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto(`${guiUrl}/`, {
      timeout: 30000,
      waitUntil: 'domcontentloaded',
    });
    await page
      .getByText('AI Connected', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    browser.on('disconnected', () => {
      process.stderr.write('[keeper] browser disconnected unexpectedly\n');
      shutdown(1);
    });

    process.stdout.write(`${readyToken}\n`);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    process.stderr.write(`[keeper] failed to open page: ${msg}\n`);
    await shutdown(1);
  }
})();
