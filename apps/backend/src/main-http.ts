import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createPinoLogger, createLoggerService } from "./bootstrap";
import { parseCliArgs, displayStartupBanner } from "./cli";
import { WsAdapter } from "@nestjs/platform-ws";

async function bootstrap() {
  const options = parseCliArgs();

  // Set environment variables from CLI options
  process.env.PORT = options.port.toString();
  process.env.HOST = options.host;

  // Create logger that writes to stdout (fd 1) for HTTP mode
  const pinoLogger = createPinoLogger(1);
  const loggerService = createLoggerService(pinoLogger);

  // HTTP mode - create NestJS HTTP application with WebSocket support
  const app = await NestFactory.create(AppModule.forHttp(), {
    logger: loggerService,
    bufferLogs: true,
  });

  // Configure WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Show startup information
  displayStartupBanner(options);
  await app.listen(options.port, options.host);
}

bootstrap().catch((err) => {
  console.error("Failed to start DrawDB MCP HTTP server:", err);
  process.exit(1);
});
