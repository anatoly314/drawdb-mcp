import * as path from "path";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

export interface ContainerPorts {
  gui: number;
  mcp: number;
}

export interface RunningContainer {
  container: StartedTestContainer;
  ports: ContainerPorts;
  guiUrl: string;
  mcpUrl: string;
}

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const STARTUP_TIMEOUT_MS = 2 * 60 * 1000;

export async function startDrawdbContainer(): Promise<RunningContainer> {
  const imageRef = process.env.DRAWDB_E2E_IMAGE;

  let base: GenericContainer;
  if (imageRef && imageRef.length > 0) {
    base = new GenericContainer(imageRef);
  } else {
    base = await GenericContainer.fromDockerfile(REPO_ROOT)
      .withCache(true)
      .withBuildkit()
      .build("drawdb-mcp:e2e", { deleteOnExit: false });
  }

  const configured = base
    .withExposedPorts(80, 3000)
    .withWaitStrategy(Wait.forHttp("/", 80).forStatusCode(200))
    .withStartupTimeout(STARTUP_TIMEOUT_MS);

  let container: StartedTestContainer;
  try {
    container = await configured.start();
  } catch (err) {
    process.stderr.write(
      `[e2e] container start failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    throw err;
  }

  const guiPort = container.getMappedPort(80);
  const mcpPort = container.getMappedPort(3000);

  return {
    container,
    ports: { gui: guiPort, mcp: mcpPort },
    guiUrl: `http://localhost:${guiPort}`,
    mcpUrl: `http://localhost:${mcpPort}`,
  };
}

export async function stopDrawdbContainer(container: StartedTestContainer): Promise<void> {
  try {
    await container.stop();
  } catch (err) {
    process.stderr.write(
      `[e2e] container stop failed (ignored): ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}

export async function dumpContainerLogs(container: StartedTestContainer): Promise<void> {
  try {
    const stream = await container.logs();
    stream.on("data", (chunk: Buffer | string) => {
      process.stderr.write(`[container] ${chunk.toString()}`);
    });
    stream.on("err", (chunk: Buffer | string) => {
      process.stderr.write(`[container err] ${chunk.toString()}`);
    });
    await new Promise<void>((resolve) => {
      stream.on("end", () => resolve());
      setTimeout(() => resolve(), 2000);
    });
  } catch (err) {
    process.stderr.write(
      `[e2e] failed to dump container logs: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}
