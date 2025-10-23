import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createServer } from '../api/http.js';
import { ControlPlaneRuntime } from '../runtime/controlPlaneRuntime.js';
import { RunRepository } from '../repositories/runRepository.js';
import { EvidenceManager } from '../evidence/manager.js';
import { PolicyEngine } from '../policy/engine.js';
import { randomUUID } from 'node:crypto';

describe('Control Plane HTTP API', () => {
  let runtime: ControlPlaneRuntime;

  beforeEach(() => {
    runtime = new ControlPlaneRuntime({
      repository: new RunRepository(),
      policyEngine: new PolicyEngine(),
      evidenceManager: new EvidenceManager()
    });
  });

  it('creates runs and executes actions', async () => {
    const app = createServer(runtime);
    await app.ready();

    const createRunResponse = await request(app.server)
      .post('/runs')
      .send({ driver: 'gemini-computer-use' })
      .expect(201);

    const runId = createRunResponse.body.run.id as string;
    expect(runId).toBeDefined();

    const actionId = randomUUID();
    const now = new Date().toISOString();

    const actionResponse = await request(app.server)
      .post(`/runs/${runId}/actions`)
      .send({
        id: actionId,
        runId,
        sequence: 0,
        timestamp: now,
        agent: {
          id: randomUUID(),
          name: 'test-agent',
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

    expect(actionResponse.status).toBe(200);
    expect(actionResponse.body.run.status).toBe('running');
    expect(actionResponse.body.observations).toHaveLength(1);
    expect(actionResponse.body.policyDecisions).toHaveLength(1);

    await request(app.server).get(`/runs/${runId}`).expect(200);
    await request(app.server).get(`/runs/${runId}/observations`).expect(200);
    await request(app.server).get(`/runs/${runId}/decisions`).expect(200);
    await request(app.server).get(`/runs/${runId}/evidence`).expect(200);
    await request(app.server)
      .get(`/runs/${runId}/summary`)
      .expect(200)
      .then((response) => {
        expect(response.body.run.id).toBe(runId);
        expect(response.body.actions).toHaveLength(1);
        expect(response.body.observations[0].text).toContain('navigated');
      });

    await app.close();
  });
});
