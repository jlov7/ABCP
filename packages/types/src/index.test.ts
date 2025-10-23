import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  abcpErrorCodeSchema,
  actionEventSchema,
  evidenceBundleSchema,
  policyDecisionSchema,
  apiErrorResponseSchema,
  paginatedResponseSchema,
  safeJsonSchema
} from './index';

describe('shared schemas', () => {
  it('should validate action event with minimal optional fields', () => {
    const now = new Date().toISOString();
    const result = actionEventSchema.parse({
      id: randomUUID(),
      runId: randomUUID(),
      sequence: 0,
      timestamp: now,
      agent: {
        id: randomUUID(),
        name: 'Test Agent',
        driver: 'gemini-computer-use'
      },
      context: {
        idempotencyKey: randomUUID()
      },
      target: {},
      payload: {
        type: 'navigate'
      },
      status: 'planned'
    });

    expect(result.status).toBe('planned');
  });

  it('should reject invalid locale format', () => {
    const validate = () =>
      actionEventSchema.parse({
        id: randomUUID(),
        runId: randomUUID(),
        sequence: 0,
        timestamp: new Date().toISOString(),
        agent: {
          id: randomUUID(),
          name: 'Test Agent',
          driver: 'gemini-computer-use'
        },
        context: {
          idempotencyKey: randomUUID(),
          locale: 'english'
        },
        target: {},
        payload: {
          type: 'navigate'
        },
        status: 'planned'
      });

    expect(validate).toThrowError();
  });

  it('should support pagination helper schema', () => {
    const schema = paginatedResponseSchema(z.object({ id: z.string().uuid() }));
    const parsed = schema.parse({
      items: [{ id: randomUUID() }],
      total: 1
    });

    expect(parsed.total).toBe(1);
    expect(parsed.nextCursor).toBeUndefined();
  });

  it('should enforce evidence artifact hashing format', () => {
    const invalid = () =>
      evidenceBundleSchema.parse({
        id: randomUUID(),
        runId: randomUUID(),
        createdAt: new Date().toISOString(),
        artifacts: [
          {
            id: randomUUID(),
            type: 'screenshot',
            contentType: 'image/png',
            path: '/tmp/a.png',
            sha256: 'invalid',
            sizeBytes: 10
          }
        ]
      });

    expect(invalid).toThrow();
  });

  it('should enumerate error codes without duplicates', () => {
    const uniqueCodes = new Set(abcpErrorCodeSchema.options);
    expect(uniqueCodes.size).toBe(abcpErrorCodeSchema.options.length);
  });

  it('should ensure safe JSON guard rejects functions', () => {
    expect(safeJsonSchema.safeParse(() => null).success).toBe(false);
    expect(safeJsonSchema.parse({ a: 1, b: ['test'] })).toMatchObject({ a: 1, b: ['test'] });
  });

  it('should enforce structured API error response', () => {
    const parsed = apiErrorResponseSchema.safeParse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing field',
        correlationId: randomUUID()
      }
    });

    expect(parsed.success).toBe(true);
  });

  it('should require policy decision reason text', () => {
    const invalid = () =>
      policyDecisionSchema.parse({
        id: randomUUID(),
        runId: randomUUID(),
        timestamp: new Date().toISOString(),
        verdict: 'deny',
        policyId: 'example-policy'
      });

    expect(invalid).toThrow();
  });
});
