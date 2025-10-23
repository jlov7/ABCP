import type {
  ActionEvent,
  AgentRun,
  Observation,
  PolicyDecision,
  EvidenceBundle
} from '@abcp/types';

export class RunRepository {
  private readonly runs = new Map<string, AgentRun>();
  private readonly actions = new Map<string, ActionEvent[]>();
  private readonly observations = new Map<string, Observation[]>();
  private readonly decisions = new Map<string, PolicyDecision[]>();
  private readonly evidence = new Map<string, EvidenceBundle | undefined>();

  saveRun(run: AgentRun): void {
    this.runs.set(run.id, run);
  }

  appendAction(action: ActionEvent): void {
    const list = this.actions.get(action.runId) ?? [];
    list.push(action);
    this.actions.set(action.runId, list);
  }

  appendObservations(runId: string, items: Observation[]): void {
    const list = this.observations.get(runId) ?? [];
    list.push(...items);
    this.observations.set(runId, list);
  }

  appendDecision(runId: string, decision: PolicyDecision): void {
    const list = this.decisions.get(runId) ?? [];
    list.push(decision);
    this.decisions.set(runId, list);
  }

  saveEvidence(runId: string, bundle: EvidenceBundle): void {
    this.evidence.set(runId, bundle);
  }

  getRun(runId: string): AgentRun | undefined {
    return this.runs.get(runId);
  }

  getActions(runId: string): ActionEvent[] {
    return this.actions.get(runId) ?? [];
  }

  getObservations(runId: string): Observation[] {
    return this.observations.get(runId) ?? [];
  }

  getDecisions(runId: string): PolicyDecision[] {
    return this.decisions.get(runId) ?? [];
  }

  getEvidence(runId: string): EvidenceBundle | undefined {
    return this.evidence.get(runId);
  }

  getSummary(runId: string): {
    run: AgentRun | undefined;
    actions: ActionEvent[];
    observations: Observation[];
    decisions: PolicyDecision[];
    evidence: EvidenceBundle | undefined;
  } {
    return {
      run: this.getRun(runId),
      actions: this.getActions(runId),
      observations: this.getObservations(runId),
      decisions: this.getDecisions(runId),
      evidence: this.getEvidence(runId)
    };
  }
}
