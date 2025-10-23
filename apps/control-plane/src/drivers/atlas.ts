import { randomUUID } from 'node:crypto';
import type { ActionEvent, AgentRun, Observation } from '@abcp/types';
import { env } from '../config/index.js';
import type { ControlPlaneDriver, DriverContext, DriverResult } from './base.js';
import { DriverNotAvailableError } from './base.js';

export class AtlasOverlayDriver implements ControlPlaneDriver {
  public readonly name = 'atlas-overlay';

  canHandle(run: AgentRun): boolean {
    return run.driver === this.name;
  }

  async execute(event: ActionEvent, context: DriverContext): Promise<DriverResult> {
    if (!env.ATLAS_COMPANION_ENDPOINT) {
      if (process.env.NODE_ENV === 'test') {
        return this.simulatedResult(event, context);
      }
      throw new DriverNotAvailableError('Atlas companion endpoint missing');
    }

    // TODO(jasonlovell): Capture DOM/network observation from Atlas overlay when API is available.

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
      dataRef: 'inline://atlas-overlay',
      text: `Atlas overlay captured observation for ${targetUrl} (observational only)`
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
