import { Module, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { McpModule, McpTransportType } from "@rekog/mcp-nest";
import { OrpcWsModule, fromNestShape } from "@orpc-ws/server-nestjs";
import { clientContract } from "@drawdb-mcp/remote-control-contract";
import { McpPrimitivesDrawDBModule } from "./mcp/primitives/essential";
import { DrawDBModule } from "./drawdb";

function getServerName(): string {
  return process.env.MCP_SERVER_NAME || "drawdb-mcp-server";
}

function getServerVersion(): string {
  return process.env.MCP_SERVER_VERSION || "0.1.0";
}

const serverName = getServerName();

/**
 * Root module for the HTTP (Streamable HTTP) transport with the ORPC
 * WebSocket remote-control server. HTTP is the only transport — STDIO mode
 * was removed (it never had a WebSocket, so every tool call failed).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
    }),

    McpModule.forRoot({
      name: serverName,
      version: getServerVersion(),
      transport: McpTransportType.STREAMABLE_HTTP,
      mcpEndpoint: "/",
    }),

    // ORPC WebSocket server for the GUI remote-control connection.
    //
    // - `mode: "authless"`: every upgrade accepted; the single-global-
    //   connection default means a new GUI kicks the previous one
    //   (close code 4005) — the "one GUI at a time" model.
    // - `router: {}`: there are no client->server procedures — the GUI
    //   hosts the procedures (clientContract) and the backend calls them
    //   through `conn.client` (see DrawDBClientService).
    // - `path: "/remote-control"`: MUST stay — nginx proxies this path
    //   to the backend in the Docker image.
    //
    // `forRoot` (not forRootAsync) so `TClientContract` is inferred from
    // the `clientContract` VALUE — with a bare async factory the generic
    // collapses to `never` unless the return type is annotated.
    OrpcWsModule.forRoot({
      mode: "authless",
      router: {},
      clientContract,
      connection: { path: "/remote-control" },
      logger: fromNestShape(new Logger("OrpcWs")),
    }),

    DrawDBModule,

    McpPrimitivesDrawDBModule.forRoot(serverName),
  ],
})
export class AppModule {}
