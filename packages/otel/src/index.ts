import type { Span, SpanOptions } from '@opentelemetry/api';
import {
  context,
  diag,
  trace,
  DiagConsoleLogger,
  DiagLogLevel,
  SpanStatusCode
} from '@opentelemetry/api';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import type { PolicyDecision } from '@abcp/types';

/**
 * Configuration options for initializing OpenTelemetry within ABCP.
 */
export interface TelemetryOptions {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  environment?: 'development' | 'staging' | 'production' | 'test';
  enableDebugLogs?: boolean;
  resourceAttributes?: Record<string, string>;
}

export interface GenAiSpanAttributes {
  system: 'gemini' | 'bedrock' | 'atlas' | 'abcp-control-plane';
  operationName: string;
  outputType?: string;
  toolName?: string;
  providerName?: string;
  additionalAttributes?: Record<string, string | number | boolean>;
}

export interface PolicySpanAttributes {
  decision: PolicyDecision;
  policyLatencyMs?: number;
}

const defaultResourceAttributes: Record<string, string> = {
  'service.namespace': 'abcp',
  'service.instance.id': process.env.HOSTNAME ?? 'local'
};

export const GEN_AI_ATTRIBUTE_KEYS = {
  system: 'gen_ai.system',
  operationName: 'gen_ai.operation.name',
  outputType: 'gen_ai.output.type',
  toolName: 'gen_ai.tool.name',
  providerName: 'gen_ai.provider.name'
} as const;

/**
 * Initializes the OpenTelemetry NodeSDK with OTLP exporters.
 */
export const createTelemetrySdk = (options: TelemetryOptions): NodeSDK => {
  if (options.enableDebugLogs) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  } else {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const resource = defaultResource().merge(
    resourceFromAttributes({
      ...defaultResourceAttributes,
      'service.name': options.serviceName,
      'service.version': options.serviceVersion ?? '0.1.0',
      'deployment.environment': options.environment ?? process.env.NODE_ENV ?? 'development',
      ...options.resourceAttributes
    })
  );

  const traceExporter =
    options.otlpEndpoint === undefined
      ? undefined
      : new OTLPTraceExporter({ url: `${options.otlpEndpoint}/v1/traces` });

  const metricExporter =
    options.otlpEndpoint === undefined
      ? undefined
      : new OTLPMetricExporter({ url: `${options.otlpEndpoint}/v1/metrics` });

  const metricReader =
    metricExporter === undefined
      ? undefined
      : new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 15_000
        });

  return new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    autoDetectResources: true
  });
};

/**
 * Executes a callback inside an active span annotated with GenAI semantic conventions.
 */
export const withGenAiSpan = async <T>(
  name: string,
  attributes: GenAiSpanAttributes,
  fn: (span: Span) => Promise<T>,
  spanOptions: SpanOptions = {}
): Promise<T> => {
  const tracer = trace.getTracer('abcp');

  return tracer.startActiveSpan(
    name,
    {
      ...spanOptions,
      attributes: {
        [GEN_AI_ATTRIBUTE_KEYS.system]: attributes.system,
        [GEN_AI_ATTRIBUTE_KEYS.operationName]: attributes.operationName,
        ...(attributes.outputType
          ? { [GEN_AI_ATTRIBUTE_KEYS.outputType]: attributes.outputType }
          : {}),
        ...(attributes.toolName ? { [GEN_AI_ATTRIBUTE_KEYS.toolName]: attributes.toolName } : {}),
        ...(attributes.providerName
          ? { [GEN_AI_ATTRIBUTE_KEYS.providerName]: attributes.providerName }
          : {}),
        'abcp.operation.task': attributes.operationName,
        ...attributes.additionalAttributes
      }
    },
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
};

export const withPolicySpan = async <T>(
  name: string,
  attributes: PolicySpanAttributes,
  fn: (span: Span) => Promise<T>,
  spanOptions: SpanOptions = {}
): Promise<T> =>
  withGenAiSpan(
    name,
    {
      system: 'abcp-control-plane',
      operationName: 'policy-evaluation',
      additionalAttributes: {
        'abcp.policy.id': attributes.decision.policyId,
        'abcp.policy.verdict': attributes.decision.verdict,
        'abcp.policy.reason': attributes.decision.reason,
        'abcp.policy.run_id': attributes.decision.runId,
        ...(attributes.decision.actionId ? { 'abcp.policy.action_id': attributes.decision.actionId } : {}),
        ...(attributes.policyLatencyMs !== undefined
          ? { 'abcp.policy.latency_ms': attributes.policyLatencyMs }
          : {})
      }
    },
    fn,
    spanOptions
  );

/**
 * Utility to start a span manually when existing context should be preserved.
 */
export const startSpan = (name: string, options?: SpanOptions): Span => {
  const tracer = trace.getTracer('abcp');
  return tracer.startSpan(name, options, context.active());
};
