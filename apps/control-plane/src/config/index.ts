import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('4000'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_PROJECT_ID: z.string().optional(),
  BEDROCK_AGENTCORE_GATEWAY_URL: z.string().optional(),
  AWS_REGION: z.string().optional(),
  ATLAS_COMPANION_ENDPOINT: z.string().optional(),
  DATABASE_URL: z.string().default('file:./data/control-plane.sqlite'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

export type Env = typeof env;
