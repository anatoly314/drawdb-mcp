import { Browser, Page, chromium } from 'playwright';

export interface GuiSession {
  browser: Browser;
  page: Page;
}

const GOTO_TIMEOUT_MS = 30_000;
const WS_WAIT_TIMEOUT_MS = 30_000;

export async function openGui(guiUrl: string): Promise<GuiSession> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${guiUrl}/`, {
    timeout: GOTO_TIMEOUT_MS,
    waitUntil: 'domcontentloaded',
  });
  return { browser, page };
}

export async function waitForWsConnected(page: Page): Promise<void> {
  try {
    await page
      .getByText('AI Connected', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: WS_WAIT_TIMEOUT_MS });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Timed out waiting for "AI Connected" indicator. Check that VITE_REMOTE_CONTROL_ENABLED is set in the Docker image build (it is set in the project Dockerfile by default). Underlying error: ${cause}`,
    );
  }
}

export async function closeGui(browser: Browser): Promise<void> {
  try {
    await browser.close();
  } catch (err) {
    process.stderr.write(
      `[e2e] browser close failed (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}
