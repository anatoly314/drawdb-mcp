import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { chromium } from 'playwright';
import {
  dumpContainerLogs,
  startDrawdbContainer,
  stopDrawdbContainer,
} from '../helpers/containers';
import { listTools } from '../helpers/mcp';

interface PersistedState {
  containerId: string;
  guiUrl: string;
  mcpUrl: string;
  browserWsEndpoint: string;
  browserServerPid: number | null;
  keeperPid: number | null;
}

const STATE_FILE = path.join(os.tmpdir(), 'drawdb-e2e-state.json');
const KEEPER_LOG_FILE = path.join(os.tmpdir(), 'drawdb-e2e-keeper.log');
const KEEPER_SCRIPT = path.resolve(__dirname, 'browser-keeper.js');
const MCP_READY_TIMEOUT_MS = 60_000;
const MCP_POLL_INTERVAL_MS = 1_000;
const KEEPER_READY_TIMEOUT_MS = 60_000;
const KEEPER_READY_TOKEN = 'KEEPER_READY';

async function waitForMcpReady(): Promise<void> {
  const deadline = Date.now() + MCP_READY_TIMEOUT_MS;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      listTools();
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, MCP_POLL_INTERVAL_MS));
    }
  }
  const cause = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`MCP server did not become ready within ${MCP_READY_TIMEOUT_MS}ms: ${cause}`);
}

interface KeeperHandle {
  pid: number;
}

async function spawnBrowserKeeper(
  wsEndpoint: string,
  guiUrl: string,
): Promise<KeeperHandle> {
  const logFd = fs.openSync(KEEPER_LOG_FILE, 'w');
  const child = spawn(process.execPath, [KEEPER_SCRIPT], {
    detached: true,
    stdio: ['ignore', 'pipe', logFd],
    env: {
      ...process.env,
      BROWSER_WS_ENDPOINT: wsEndpoint,
      GUI_URL: guiUrl,
      READY_TOKEN: KEEPER_READY_TOKEN,
    },
  });

  if (child.pid === undefined) {
    fs.closeSync(logFd);
    throw new Error('failed to spawn browser keeper (no pid)');
  }

  const pid = child.pid;
  let buffered = '';
  let resolved = false;
  let exited = false;
  let exitInfo: { code: number | null; signal: NodeJS.Signals | null } | null = null;

  const ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      reject(
        new Error(
          `browser keeper did not signal ready within ${KEEPER_READY_TIMEOUT_MS}ms. Log: ${KEEPER_LOG_FILE}`,
        ),
      );
    }, KEEPER_READY_TIMEOUT_MS);

    child.stdout?.on('data', (chunk: Buffer) => {
      buffered += chunk.toString('utf-8');
      if (buffered.includes(KEEPER_READY_TOKEN)) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve();
      }
    });

    child.on('exit', (code, signal) => {
      exited = true;
      exitInfo = { code, signal };
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      reject(
        new Error(
          `browser keeper exited before ready (code=${code} signal=${signal}). Log: ${KEEPER_LOG_FILE}`,
        ),
      );
    });

    child.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      reject(err);
    });
  });

  try {
    await ready;
  } catch (err) {
    try { fs.closeSync(logFd); } catch {}
    if (!exited) {
      try { process.kill(pid, 'SIGKILL'); } catch {}
    }
    throw err;
  }

  child.stdout?.removeAllListeners('data');
  child.removeAllListeners('exit');
  child.removeAllListeners('error');
  child.unref();
  child.stdout?.destroy();
  try { fs.closeSync(logFd); } catch {}

  void exitInfo;

  return { pid };
}

export default async function globalSetup(): Promise<void> {
  process.stderr.write('[e2e] starting drawdb container...\n');
  const running = await startDrawdbContainer();
  process.stderr.write(
    `[e2e] container started: gui=${running.guiUrl} mcp=${running.mcpUrl}\n`,
  );

  process.env.MCP_URL = running.mcpUrl;
  process.env.GUI_URL = running.guiUrl;

  let browserServerPid: number | null = null;
  let wsEndpoint: string | null = null;
  let keeperPid: number | null = null;

  try {
    process.stderr.write('[e2e] waiting for MCP server to respond...\n');
    await waitForMcpReady();

    process.stderr.write('[e2e] launching browser server...\n');
    const server = await chromium.launchServer({ headless: true });
    wsEndpoint = server.wsEndpoint();
    const child = server.process();
    browserServerPid = child ? child.pid ?? null : null;

    process.stderr.write('[e2e] spawning browser keeper to hold GUI page open...\n');
    const keeper = await spawnBrowserKeeper(wsEndpoint, running.guiUrl);
    keeperPid = keeper.pid;
    process.stderr.write(`[e2e] browser keeper ready (pid=${keeperPid})\n`);

    const state: PersistedState = {
      containerId: running.container.getId(),
      guiUrl: running.guiUrl,
      mcpUrl: running.mcpUrl,
      browserWsEndpoint: wsEndpoint,
      browserServerPid,
      keeperPid,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    process.stderr.write(`[e2e] setup complete; state at ${STATE_FILE}\n`);
  } catch (err) {
    process.stderr.write(
      `[e2e] global setup failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    if (keeperPid !== null) {
      try { process.kill(keeperPid, 'SIGTERM'); } catch {}
    }
    if (browserServerPid !== null) {
      try { process.kill(browserServerPid, 'SIGTERM'); } catch {}
    }
    await dumpContainerLogs(running.container);
    await stopDrawdbContainer(running.container);
    throw err;
  }
}
