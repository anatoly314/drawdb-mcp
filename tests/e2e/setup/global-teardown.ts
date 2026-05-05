import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface PersistedState {
  containerId: string;
  guiUrl: string;
  mcpUrl: string;
  browserWsEndpoint: string;
  browserServerPid: number | null;
  keeperPid: number | null;
}

const STATE_FILE = path.join(os.tmpdir(), 'drawdb-e2e-state.json');

function readState(): PersistedState | null {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as PersistedState;
  } catch (err) {
    process.stderr.write(
      `[e2e] failed to read state file (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return null;
  }
}

async function killProcess(pid: number | null, label: string): Promise<void> {
  if (pid === null) return;
  try {
    process.kill(pid, 'SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
    try {
      process.kill(pid, 0);
      process.kill(pid, 'SIGKILL');
    } catch {
      return;
    }
  } catch (err) {
    process.stderr.write(
      `[e2e] ${label} kill failed (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}

function stopContainerById(containerId: string): void {
  try {
    execFileSync('docker', ['stop', containerId], {
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 30_000,
    });
  } catch (err) {
    process.stderr.write(
      `[e2e] docker stop failed (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
  try {
    execFileSync('docker', ['rm', '-f', containerId], {
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 30_000,
    });
  } catch (err) {
    process.stderr.write(
      `[e2e] docker rm failed (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}

function deleteStateFile(): void {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
  } catch (err) {
    process.stderr.write(
      `[e2e] failed to delete state file (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}

export default async function globalTeardown(): Promise<void> {
  const state = readState();
  if (!state) {
    process.stderr.write('[e2e] no state file found, nothing to tear down\n');
    return;
  }

  await killProcess(state.keeperPid, 'browser keeper');
  await killProcess(state.browserServerPid, 'browser server');
  stopContainerById(state.containerId);
  deleteStateFile();
  process.stderr.write('[e2e] teardown complete\n');
}
