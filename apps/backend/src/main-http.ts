import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createPinoLogger, createLoggerService } from "./bootstrap";
import { parseCliArgs, displayStartupBanner } from "./cli";

async function bootstrap() {
  const options = parseCliArgs();

  // Set environment variables from CLI options
  process.env.PORT = options.port.toString();
  process.env.HOST = options.host;

  // Create logger that writes to stdout (fd 1)
  const pinoLogger = createPinoLogger(1);
  const loggerService = createLoggerService(pinoLogger);

  // Create NestJS HTTP application; the ORPC WebSocket server (OrpcWsModule)
  // attaches itself to the underlying http.Server at OnApplicationBootstrap.
  const app = await NestFactory.create(AppModule, {
    logger: loggerService,
    bufferLogs: true,
  });

  // Required for OrpcWsService's BeforeApplicationShutdown hook — without it
  // dispose() never runs and GUI clients see a TCP RST instead of the clean
  // 4009 close frame on shutdown.
  app.enableShutdownHooks();

  // Show startup information
  displayStartupBanner(options);
  await app.listen(options.port, options.host);
}

bootstrap().catch((err) => {
  console.error("Failed to start DrawDB MCP HTTP server:", err);
  process.exit(1);
});
