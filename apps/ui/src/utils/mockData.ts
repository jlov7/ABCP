import type { ActionEvent, Observation, PolicyDecision } from '@abcp/types';

export interface TimelineData {
  actions: ActionEvent[];
  observations: Observation[];
  decisions: PolicyDecision[];
  evidenceAvailable: boolean;
}

export const createMockTimelineData = (): TimelineData => {
  const runId = crypto.randomUUID();
  const actionId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  return {
    actions: [
      {
        id: actionId,
        runId,
        sequence: 0,
        timestamp,
        agent: {
          id: crypto.randomUUID(),
          name: 'Baseline Gemini Agent',
          driver: 'gemini-computer-use'
        },
        context: {
          idempotencyKey: crypto.randomUUID()
        },
        target: {
          url: 'https://example.com'
        },
        payload: {
          type: 'navigate'
        },
        status: 'succeeded'
      }
    ],
    decisions: [
      {
        id: crypto.randomUUID(),
        runId,
        actionId,
        policyId: 'policy::baseline-allow',
        verdict: 'allow',
        reason: 'Baseline rule allow',
        timestamp
      }
    ],
    observations: [
      {
        id: crypto.randomUUID(),
        runId,
        actionId,
        timestamp,
        type: 'log',
        contentType: 'application/json',
        dataRef: 'inline://observation',
        text: 'Gemini Computer Use navigated to https://example.com/login'
      }
    ],
    evidenceAvailable: true
  };
};
