import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { McpPrimitivesDrawDBModule } from './mcp/primitives/essential';
import { DrawDBModule } from './drawdb';

@Module({})
export class AppModule {
  /**
   * Creates AppModule configured for STDIO transport
   */
  static forStdio(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Configuration Module
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env.local', '.env'],
        }),

        // MCP Module with STDIO transport
        McpModule.forRoot({
          name: process.env.MCP_SERVER_NAME || 'drawdb-mcp-server',
          version: process.env.MCP_SERVER_VERSION || '0.1.0',
          transport: McpTransportType.STDIO,
        }),

        // Import DrawDB MCP primitives
        McpPrimitivesDrawDBModule.forRoot(),
      ],
    };
  }

  /**
   * Creates AppModule configured for HTTP (Streamable HTTP) transport with WebSocket support
   */
  static forHttp(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Configuration Module
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env.local', '.env'],
        }),

        // MCP Module with Streamable HTTP transport
        McpModule.forRoot({
          name: process.env.MCP_SERVER_NAME || 'drawdb-mcp-server',
          version: process.env.MCP_SERVER_VERSION || '0.1.0',
          transport: McpTransportType.STREAMABLE_HTTP,
          mcpEndpoint: '/',
        }),

        // Import DrawDB module (includes WebSocket gateway)
        DrawDBModule,

        // Import DrawDB MCP primitives
        McpPrimitivesDrawDBModule.forRoot(),
      ],
    };
  }
}
