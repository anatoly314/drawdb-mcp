import { execFileSync } from 'child_process';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface McpToolCallContent {
  type?: string;
  text?: string;
  [k: string]: unknown;
}

interface McpToolCallResponse {
  content?: McpToolCallContent[];
  structuredContent?: unknown;
  isError?: boolean;
  [k: string]: unknown;
}

interface McpToolsListResponse {
  tools?: McpTool[];
  [k: string]: unknown;
}

const SUBPROCESS_TIMEOUT_MS = 30_000;

function getMcpUrl(): string {
  const url = process.env.MCP_URL;
  if (!url || url.length === 0) {
    throw new Error(
      'MCP_URL is not set. The e2e global setup must run before tests can call MCP tools.',
    );
  }
  return url;
}

function runInspector(args: string[]): string {
  return execFileSync('npx', ['@modelcontextprotocol/inspector', ...args], {
    encoding: 'utf-8',
    timeout: SUBPROCESS_TIMEOUT_MS,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function parseJson(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    throw new Error('MCP inspector returned empty stdout');
  }
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `MCP inspector stdout was not valid JSON: ${cause}. Output: ${trimmed.slice(0, 500)}`,
    );
  }
}

function unwrapTextPayload(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function extractResult(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== 'object') {
    return parsed;
  }
  const obj = parsed as McpToolCallResponse;
  let payload: unknown;
  if (Array.isArray(obj.content) && obj.content.length > 0) {
    const first = obj.content[0];
    if (first && typeof first.text === 'string') {
      payload = unwrapTextPayload(first.text);
    }
  }
  if (payload === undefined && obj.structuredContent !== undefined) {
    payload = obj.structuredContent;
  }
  if (payload === undefined) {
    return parsed;
  }
  if (obj.isError) {
    if (payload && typeof payload === 'object') {
      const payloadObj = payload as Record<string, unknown>;
      const message =
        typeof payloadObj.text === 'string'
          ? payloadObj.text
          : typeof payloadObj.message === 'string'
            ? payloadObj.message
            : JSON.stringify(payloadObj);
      return { success: false, message, ...payloadObj };
    }
    return { success: false, message: String(payload) };
  }
  return payload;
}

export function callTool(
  name: string,
  args: Record<string, unknown> = {},
): unknown {
  const mcpUrl = getMcpUrl();
  const cliArgs: string[] = [
    '--cli',
    mcpUrl,
    '--transport',
    'http',
    '--method',
    'tools/call',
    '--tool-name',
    name,
  ];
  for (const [key, value] of Object.entries(args)) {
    if (value === null || value === undefined) {
      continue;
    }
    const serialized = JSON.stringify(value);
    cliArgs.push('--tool-arg', `${key}=${serialized}`);
  }

  const stdout = runInspector(cliArgs);
  const parsed = parseJson(stdout);
  return extractResult(parsed);
}

export function listTools(): McpTool[] {
  const mcpUrl = getMcpUrl();
  const stdout = runInspector([
    '--cli',
    mcpUrl,
    '--transport',
    'http',
    '--method',
    'tools/list',
  ]);
  const parsed = parseJson(stdout) as McpToolsListResponse;
  if (!Array.isArray(parsed.tools)) {
    throw new Error(
      `tools/list response missing "tools" array: ${JSON.stringify(parsed).slice(0, 500)}`,
    );
  }
  return parsed.tools;
}
