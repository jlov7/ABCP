import { NodeSDK } from '@opentelemetry/sdk-node';
import { env } from '../config/index.js';
import { createTelemetrySdk } from '@abcp/otel';
import { logger } from '../utils/logger.js';

let telemetrySdk: NodeSDK | undefined;

export const initTelemetry = (): void => {
  if (telemetrySdk) {
    return;
  }

  telemetrySdk = createTelemetrySdk({
    serviceName: 'abcp-control-plane',
    serviceVersion: '0.1.0',
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    environment: env.NODE_ENV
  });

  telemetrySdk
    .start()
    .then(() => {
      logger.info('Telemetry initialized');
    })
    .catch((error) => {
      logger.error({ error }, 'Failed to start telemetry');
    });
};

export const shutdownTelemetry = async (): Promise<void> => {
  if (!telemetrySdk) {
    return;
  }

  await telemetrySdk.shutdown();
  telemetrySdk = undefined;
};
