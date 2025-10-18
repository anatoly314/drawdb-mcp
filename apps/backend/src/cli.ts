import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface CliOptions {
  port: number;
  host: string;
}

function getPackageJson() {
  try {
    return JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  } catch {
    return { version: '0.1.0', name: 'drawdb-mcp-server' };
  }
}

function getVersion(): string {
  return getPackageJson().version;
}

export function parseCliArgs(): CliOptions {
  const program = new Command();

  program
    .name('drawdb-mcp')
    .description('DrawDB MCP Server - Model Context Protocol server for DrawDB')
    .version(getVersion())
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-h, --host <address>', 'Host to bind to', '127.0.0.1')
    .addHelpText(
      'after',
      `
Examples:
  $ drawdb-mcp                                 # Use defaults
  $ drawdb-mcp --port 8080                     # Custom port
  $ drawdb-mcp --host 0.0.0.0 --port 3000      # Listen on all interfaces

Environment Variables:
  MCP_SERVER_NAME     Override server name (default: drawdb-mcp-server)
  MCP_SERVER_VERSION  Override server version
  PORT                Default port (overridden by --port)
  HOST                Default host (overridden by --host)

WebSocket Endpoint:
  The server will expose a WebSocket endpoint at /remote-control for
  DrawDB client connections.

MCP Endpoint:
  The MCP protocol endpoint is available at /mcp

For more information, visit: https://github.com/anatoly314/drawdb-mcp
`,
    )
    .parse();

  const options = program.opts();

  return {
    port: parseInt(options.port, 10),
    host: options.host,
  };
}

export function displayStartupBanner(options: CliOptions): void {
  console.log('\n🎨 DrawDB MCP Server started\n');
  console.log(`  HTTP server listening on http://${options.host}:${options.port}`);
  console.log(`  MCP endpoint: http://${options.host}:${options.port}/`);
  console.log(`  WebSocket endpoint: ws://${options.host}:${options.port}/remote-control`);
  console.log('\n  Configure your DrawDB frontend with:');
  console.log(`    VITE_REMOTE_CONTROL_ENABLED=true`);
  console.log(`    VITE_REMOTE_CONTROL_WS=ws://${options.host}:${options.port}/remote-control`);
  console.log('\n  Press Ctrl+C to stop the server\n');
}
