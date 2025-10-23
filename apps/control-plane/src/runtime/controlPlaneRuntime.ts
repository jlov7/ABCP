import { randomUUID } from 'node:crypto';
import { StateGraph } from '@langchain/langgraph';
import type {
  ActionEvent,
  AgentRun,
  PolicyDecision,
  EvidenceBundle,
  Observation
} from '@abcp/types';
import { ControlPlaneState, type ControlPlaneStateType } from './state.js';
import { PolicyEngine } from '../policy/engine.js';
import { EvidenceManager } from '../evidence/manager.js';
import { executeWithDriver } from '../drivers/index.js';
import { RunRepository } from '../repositories/runRepository.js';
import { logger } from '../utils/logger.js';

interface ExecuteInput {
  run: AgentRun;
  action: ActionEvent;
}

export class ControlPlaneRuntime {
  private readonly policyEngine: PolicyEngine;
  private readonly evidenceManager: EvidenceManager;
  private readonly repository: RunRepository;

  constructor(args: {
    policyEngine?: PolicyEngine;
    evidenceManager?: EvidenceManager;
    repository?: RunRepository;
  } = {}) {
    this.policyEngine = args.policyEngine ?? new PolicyEngine();
    this.evidenceManager = args.evidenceManager ?? new EvidenceManager();
    this.repository = args.repository ?? new RunRepository();
  }

  async execute({ run, action }: ExecuteInput): Promise<ControlPlaneStateType> {
    const graph = this.buildGraph();

    const initialState: ControlPlaneStateType = {
      run,
      actions: [],
      observations: [],
      policyDecisions: [],
      pendingAction: action,
      evidence: undefined
    };

    const result = await graph.invoke(initialState);

    this.persist(result);
    return result;
  }

  private buildGraph() {
    const graph = new StateGraph(ControlPlaneState)
      .addNode('policy', (state) => this.policyNode(state))
      .addNode('execute', (state) => this.executeNode(state))
      .addNode('collectEvidence', (state) => this.evidenceNode(state))
      .addEdge('__start__', 'policy')
      .addEdge('policy', 'execute')
      .addEdge('execute', 'collectEvidence')
      .addEdge('collectEvidence', '__end__')
      .compile();

    return graph;
  }

  private policyNode(state: ControlPlaneStateType): Partial<ControlPlaneStateType> {
    const action = state.pendingAction;
    if (!action) {
      throw new Error('No pending action to evaluate');
    }

    const decision = this.policyEngine.evaluate(action);
    const updates: Partial<ControlPlaneStateType> = {
      policyDecisions: [decision]
    };

    if (decision.verdict === 'deny') {
      updates.run = {
        ...state.run,
        status: 'halted',
        updatedAt: new Date().toISOString(),
        error: {
          code: 'POLICY_DENIED',
          message: decision.reason
        }
      };
      updates.pendingAction = undefined;
    }

    if (decision.verdict === 'requires-approval') {
      updates.run = {
        ...state.run,
        status: 'halted',
        updatedAt: new Date().toISOString(),
        error: {
          code: 'POLICY_ESCALATION_REQUIRED',
          message: decision.reason
        }
      };
      updates.pendingAction = undefined;
    }

    return updates;
  }

  private async executeNode(state: ControlPlaneStateType): Promise<Partial<ControlPlaneStateType>> {
    const action = state.pendingAction;
    if (!action) {
      return {};
    }

    const driverResult = await executeWithDriver(action, {
      run: state.run
    });

    return {
      actions: [action],
      observations: driverResult.observations,
      run: driverResult.run,
      pendingAction: undefined
    } satisfies Partial<ControlPlaneStateType>;
  }

  private async evidenceNode(state: ControlPlaneStateType): Promise<Partial<ControlPlaneStateType>> {
    if (state.observations.length === 0) {
      return {};
    }

    const bundle = await this.evidenceManager.createBundle(state.observations, {
      runId: state.run.id
    });

    return {
      evidence: bundle
    } satisfies Partial<ControlPlaneStateType>;
  }

  private persist(state: ControlPlaneStateType): void {
    this.repository.saveRun(state.run);
    state.actions.forEach((action) => this.repository.appendAction(action));
    if (state.policyDecisions.length > 0) {
      state.policyDecisions.forEach((decision) =>
        this.repository.appendDecision(state.run.id, decision)
      );
    }
    if (state.observations.length > 0) {
      this.repository.appendObservations(state.run.id, state.observations);
    }
    if (state.evidence) {
      this.repository.saveEvidence(state.run.id, state.evidence);
    }
  }

  createRun(driver: string): AgentRun {
    const now = new Date().toISOString();
    const run: AgentRun = {
      id: randomUUID(),
      driver: driver as AgentRun['driver'],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      input: {}
    };
    this.repository.saveRun(run);
    return run;
  }

  getRun(runId: string): AgentRun | undefined {
    return this.repository.getRun(runId);
  }

  getObservations(runId: string): Observation[] {
    return this.repository.getObservations(runId);
  }

  getDecisions(runId: string): PolicyDecision[] {
    return this.repository.getDecisions(runId);
  }

  getEvidence(runId: string): EvidenceBundle | undefined {
    return this.repository.getEvidence(runId);
  }

  getSummary(runId: string) {
    return this.repository.getSummary(runId);
  }
}
