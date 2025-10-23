import type { ActionEvent, Observation, AgentRun } from '@abcp/types';

export interface DriverContext {
  run: AgentRun;
}

export interface DriverResult {
  observations: Observation[];
  run: AgentRun;
}

export interface ControlPlaneDriver {
  readonly name: string;
  canHandle(run: AgentRun): boolean;
  execute(event: ActionEvent, context: DriverContext): Promise<DriverResult>;
}

export class DriverNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriverNotAvailableError';
  }
}
