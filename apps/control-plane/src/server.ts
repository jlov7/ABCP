import { createServer } from './api/http.js';
import { env } from './config/index.js';
import { initTelemetry, shutdownTelemetry } from './telemetry/index.js';
import { logger } from './utils/logger.js';

const main = async () => {
  const app = createServer();
  initTelemetry();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT }, 'Control plane server started');
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    await shutdownTelemetry();
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    try {
      await app.close();
      await shutdownTelemetry();
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

void main();
