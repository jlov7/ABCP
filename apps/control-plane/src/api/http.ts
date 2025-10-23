import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ControlPlaneRuntime } from '../runtime/controlPlaneRuntime.js';
import { createRunRequestSchema, createActionRequestSchema } from './schemas.js';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export const createServer = (runtime = new ControlPlaneRuntime()): FastifyInstance => {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: logger.level ?? 'info' },
    disableRequestLogging: true
  });

  void app.register(cors);

  app.get('/health', async () => ({
    status: 'ok',
    environment: env.NODE_ENV
  }));

  app.post('/runs', async (request, reply) => {
    const parsed = createRunRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten()
        }
      });
    }

    const run = runtime.createRun(parsed.data.driver);
    return reply.status(201).send({ run });
  });

  app.post('/runs/:runId/actions', async (request, reply) => {
    const paramsSchema = z.object({ runId: z.string().uuid() });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid run id parameter'
        }
      });
    }

    const body = createActionRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid action payload',
          details: body.error.flatten()
        }
      });
    }

    const run = runtime.getRun(params.data.runId);
    if (!run) {
      return reply.status(404).send({
        error: {
          code: 'DRIVER_NOT_AVAILABLE',
          message: 'Run not found'
        }
      });
    }

    if (body.data.runId !== params.data.runId) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Action runId mismatch'
        }
      });
    }

    const result = await runtime.execute({ run, action: body.data });

    return reply.status(200).send({
      run: result.run,
      policyDecisions: result.policyDecisions,
      observations: result.observations,
      evidence: result.evidence
    });
  });

  app.get('/runs/:runId', async (request, reply) => {
    const paramsSchema = z.object({ runId: z.string().uuid() });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid run id parameter'
        }
      });
    }

    const run = runtime.getRun(params.data.runId);
    if (!run) {
      return reply.status(404).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Run not found'
        }
      });
    }

    return reply.send({ run });
  });

  app.get('/runs/:runId/observations', async (request, reply) => {
    const paramsSchema = z.object({ runId: z.string().uuid() });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid run id parameter'
        }
      });
    }

    const run = runtime.getRun(params.data.runId);
    if (!run) {
      return reply.status(404).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Run not found'
        }
      });
    }

    const observations = runtime.getObservations(params.data.runId);
    return reply.send({ observations });
  });

  app.get('/runs/:runId/decisions', async (request, reply) => {
    const paramsSchema = z.object({ runId: z.string().uuid() });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid run id parameter'
        }
      });
    }

    const run = runtime.getRun(params.data.runId);
    if (!run) {
      return reply.status(404).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Run not found'
        }
      });
    }

    const decisions = runtime.getDecisions(params.data.runId);
    return reply.send({ decisions });
  });

  app.get('/runs/:runId/evidence', async (request, reply) => {
    const paramsSchema = z.object({ runId: z.string().uuid() });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid run id parameter'
        }
      });
    }

    const run = runtime.getRun(params.data.runId);
    if (!run) {
      return reply.status(404).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Run not found'
        }
      });
    }

    const evidence = runtime.getEvidence(params.data.runId);
    return reply.send({ evidence });
  });

  app.get('/runs/:runId/summary', async (request, reply) => {
    const paramsSchema = z.object({ runId: z.string().uuid() });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid run id parameter'
        }
      });
    }

    const summary = runtime.getSummary(params.data.runId);
    if (!summary.run) {
      return reply.status(404).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Run not found'
        }
      });
    }

    return reply.send(summary);
  });

  return app;
};
