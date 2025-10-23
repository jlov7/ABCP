import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { context, trace } from '@opentelemetry/api';
import {
  GEN_AI_ATTRIBUTE_KEYS,
  createTelemetrySdk,
  withGenAiSpan,
  withPolicySpan,
  startSpan
} from './index';

describe('otel helpers', () => {
  let exporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeAll(() => {
    exporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)]
    });
    provider.register();
  });

  beforeEach(() => {
    exporter.reset();
  });

  afterEach(async () => {
    await provider.forceFlush();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  it('creates a telemetry SDK with defaults', () => {
    const sdk = createTelemetrySdk({ serviceName: 'test-service' });
    expect(sdk).toBeDefined();
  });

  it('annotates spans with GenAI semantic attributes', async () => {
    await withGenAiSpan(
      'test-span',
      {
        system: 'gemini',
        operationName: 'navigate',
        outputType: 'text/html',
        additionalAttributes: {
          'abcp.test.tag': 'value'
        }
      },
      async () => {
        return 'ok';
      }
    );
    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    const [span] = spans;
    expect(span.attributes[GEN_AI_ATTRIBUTE_KEYS.system]).toBe('gemini');
    expect(span.attributes[GEN_AI_ATTRIBUTE_KEYS.operationName]).toBe('navigate');
    expect(span.attributes[GEN_AI_ATTRIBUTE_KEYS.outputType]).toBe('text/html');
    expect(span.attributes['abcp.operation.task']).toBe('navigate');
    expect(span.attributes['abcp.test.tag']).toBe('value');
  });

  it('propagates errors and records them on spans', async () => {
    await expect(
      withGenAiSpan(
        'test-span',
        { system: 'gemini', operationName: 'fail' },
        async () => {
          throw new Error('boom');
        }
      )
    ).rejects.toThrowError('boom');

    const spans = exporter.getFinishedSpans();
    expect(spans[0].status.code).toBe(2);
  });

  it('captures policy metadata in spans', async () => {
    await withPolicySpan(
      'policy-span',
      {
        decision: {
          id: '7e3eab2e-733f-4632-82f3-4fc7b5871a91',
          runId: '7a8cb62f-97fb-49cd-a91f-c108030aa65f',
          actionId: '79c21c5c-14d6-4528-b376-2f3744d75d6a',
          timestamp: new Date().toISOString(),
          verdict: 'allow',
          reason: 'Meets policy test',
          policyId: 'policy/test'
        }
      },
      async () => undefined
    );

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    const span = spans[0];
    expect(span.attributes['abcp.policy.verdict']).toBe('allow');
    expect(span.attributes['abcp.policy.action_id']).toBe(
      '79c21c5c-14d6-4528-b376-2f3744d75d6a'
    );
  });

  it('starts spans with current context', () => {
    const span = startSpan('manual-span');
    expect(span).toBeDefined();
    span.end();
  });

  it('respects active tracing context when starting spans', () => {
    const parent = trace.getTracer('abcp').startSpan('parent');
    const ctx = trace.setSpan(context.active(), parent);
    const child = trace.getTracer('abcp').startSpan(
      'child',
      undefined,
      ctx
    );
    child.end();
    parent.end();
    expect(exporter.getFinishedSpans()).toHaveLength(2);
  });
});
