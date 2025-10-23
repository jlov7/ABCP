import { z } from 'zod';
import { actionEventSchema } from '@abcp/types';

export const createRunRequestSchema = z.object({
  driver: z.enum(['gemini-computer-use', 'bedrock-agentcore', 'atlas-overlay'])
});

export type CreateRunRequest = z.infer<typeof createRunRequestSchema>;

export const createActionRequestSchema = actionEventSchema.pick({
  id: true,
  runId: true,
  sequence: true,
  timestamp: true,
  agent: true,
  context: true,
  target: true,
  payload: true,
  status: true
});

export type CreateActionRequest = z.infer<typeof createActionRequestSchema>;
