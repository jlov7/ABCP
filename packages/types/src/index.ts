import { z } from 'zod';
import type { Jsonifiable } from 'type-fest';

/**
 * ABCP (Personal R&D) shared schemas. These schemas are used at every I/O boundary
 * to guarantee consistent validation across the control plane, UI, and evidence tooling.
 */

export const abcpErrorCodeSchema = z.enum([
  'INTERNAL_ERROR',
  'VALIDATION_ERROR',
  'POLICY_DENIED',
  'POLICY_ESCALATION_REQUIRED',
  'DRIVER_NOT_AVAILABLE',
  'DRIVER_TIMEOUT',
  'EVIDENCE_PACKING_FAILED',
  'EVIDENCE_SIGNING_FAILED',
  'OBSERVATION_INCOMPLETE',
  'UNSUPPORTED_OPERATION'
]);

export type AbcpErrorCode = z.infer<typeof abcpErrorCodeSchema>;

export const actionAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().optional(),
  driver: z.enum(['gemini-computer-use', 'bedrock-agentcore', 'atlas-overlay'])
});

export type ActionAgent = z.infer<typeof actionAgentSchema>;

export const actionContextSchema = z.object({
  locale: z
    .string()
    .regex(/^[a-z]{2}-[A-Z]{2}$/i, { message: 'Locale must follow RFC 5646 (e.g. en-US).' })
    .optional(),
  timezone: z
    .string()
    .regex(/^[A-Za-z_\/]+$/, { message: 'Timezone must be an IANA zone identifier.' })
    .optional(),
  viewport: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      deviceScaleFactor: z.number().min(0.1).max(4).optional()
    })
    .optional(),
  sessionId: z.string().uuid().optional(),
  idempotencyKey: z.string().uuid(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export type ActionContext = z.infer<typeof actionContextSchema>;

export const actionTargetSchema = z.object({
  url: z.string().url().optional(),
  selector: z.string().optional(),
  role: z.string().optional(),
  name: z.string().optional(),
  ariaLabel: z.string().optional(),
  frame: z.string().optional()
});

export type ActionTarget = z.infer<typeof actionTargetSchema>;

export const actionPayloadSchema = z.object({
  type: z.enum(['click', 'input', 'navigate', 'scroll', 'custom']),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  arguments: z
    .array(
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.record(z.string(), z.unknown()),
        z.array(z.unknown())
      ])
    )
    .optional()
});

export type ActionPayload = z.infer<typeof actionPayloadSchema>;

export const actionEventSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  sequence: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
  agent: actionAgentSchema,
  context: actionContextSchema,
  target: actionTargetSchema,
  payload: actionPayloadSchema,
  status: z.enum(['planned', 'executing', 'succeeded', 'failed']),
  correlationId: z.string().uuid().optional()
});

export type ActionEvent = z.infer<typeof actionEventSchema>;

export const observationSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  actionId: z.string().uuid(),
  timestamp: z.string().datetime(),
  type: z.enum(['dom-snapshot', 'screenshot', 'network', 'log']),
  contentType: z.string(),
  dataRef: z.string(),
  text: z.string().optional(),
  redacted: z.boolean().default(false)
});

export type Observation = z.infer<typeof observationSchema>;

export const evidenceArtifactSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['screenshot', 'har', 'dom', 'trace', 'log', 'diff']),
  contentType: z.string(),
  path: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().nonnegative(),
  c2paManifestPath: z.string().optional()
});

export type EvidenceArtifact = z.infer<typeof evidenceArtifactSchema>;

export const evidenceBundleSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  createdAt: z.string().datetime(),
  artifacts: z.array(evidenceArtifactSchema),
  cosignBundlePath: z.string().optional(),
  rekorEntryUrl: z.string().url().optional(),
  manifestHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export type EvidenceBundle = z.infer<typeof evidenceBundleSchema>;

export const policyDecisionSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  actionId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  verdict: z.enum(['allow', 'deny', 'requires-approval']),
  reason: z.string(),
  policyId: z.string(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export const runStatusSchema = z.enum(['pending', 'running', 'succeeded', 'failed', 'halted']);

export type RunStatus = z.infer<typeof runStatusSchema>;

export const agentRunSchema = z.object({
  id: z.string().uuid(),
  driver: z.enum(['gemini-computer-use', 'bedrock-agentcore', 'atlas-overlay']),
  status: runStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  input: z.record(z.string(), z.unknown()),
  output: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional(),
  error: z
    .object({
      code: abcpErrorCodeSchema,
      message: z.string(),
      details: z.record(z.string(), z.unknown()).optional()
    })
    .optional()
});

export type AgentRun = z.infer<typeof agentRunSchema>;

export const healthStatusSchema = z.object({
  component: z.enum(['control-plane', 'driver', 'evidence', 'otel']),
  status: z.enum(['healthy', 'degraded', 'unavailable']),
  timestamp: z.string().datetime(),
  details: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional()
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const redactionRuleSchema = z.object({
  id: z.string(),
  description: z.string(),
  pattern: z.union([z.string(), z.instanceof(RegExp)]),
  replacement: z.string().default('[REDACTED]')
});

export type RedactionRule = z.infer<typeof redactionRuleSchema>;

export const auditLogEntrySchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  timestamp: z.string().datetime(),
  message: z.string(),
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'critical']),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const policyEvaluationSchema = z.object({
  run: agentRunSchema,
  decisions: z.array(policyDecisionSchema),
  evidence: evidenceBundleSchema.optional()
});

export type PolicyEvaluation = z.infer<typeof policyEvaluationSchema>;

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: abcpErrorCodeSchema,
    message: z.string(),
    correlationId: z.string().uuid(),
    details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
  })
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const paginatedResponseSchema = <Schema extends z.ZodTypeAny>(itemSchema: Schema) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().optional(),
    total: z.number().int().nonnegative()
  });

export type JsonValue = Jsonifiable;

const isJsonSerializable = (value: unknown): value is Jsonifiable => {
  if (value === null) {
    return true;
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSerializable);
  }

  if (valueType === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonSerializable);
  }

  return false;
};

export const safeJsonSchema = z.custom<Jsonifiable>(isJsonSerializable, 'Value must be JSON serializable.');

export type SafeJsonValue = Jsonifiable;
