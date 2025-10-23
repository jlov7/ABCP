import { randomUUID } from 'node:crypto';
import type { ActionEvent, AgentRun, Observation } from '@abcp/types';
import { env } from '../config/index.js';
import type { ControlPlaneDriver, DriverContext, DriverResult } from './base.js';
import { DriverNotAvailableError } from './base.js';

export class GeminiComputerUseDriver implements ControlPlaneDriver {
  public readonly name = 'gemini-computer-use';

  canHandle(run: AgentRun): boolean {
    return run.driver === this.name;
  }

  async execute(event: ActionEvent, context: DriverContext): Promise<DriverResult> {
    if (!env.GEMINI_API_KEY || !env.GEMINI_PROJECT_ID) {
      if (process.env.NODE_ENV === 'test') {
        return this.simulatedResult(event, context);
      }
      throw new DriverNotAvailableError('Gemini Computer Use configuration missing');
    }

    // TODO(jasonlovell): Integrate real Gemini Computer Use API call when credentials are available.

    return this.simulatedResult(event, context);
  }

  private simulatedResult(event: ActionEvent, context: DriverContext): DriverResult {
    const targetUrl = event.target.url ?? 'about:blank';

    const observation: Observation = {
      id: randomUUID(),
      runId: context.run.id,
      actionId: event.id,
      timestamp: new Date().toISOString(),
      type: 'log',
      contentType: 'text/plain',
      dataRef: 'inline://gemini-simulated',
      text: `Gemini Computer Use navigated to ${targetUrl}`
    };

    const run: AgentRun = {
      ...context.run,
      status: 'running',
      updatedAt: new Date().toISOString()
    };

    return {
      run,
      observations: [observation]
    };
  }
}
