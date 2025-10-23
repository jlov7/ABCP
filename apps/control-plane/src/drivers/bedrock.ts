import { randomUUID } from 'node:crypto';
import type { ActionEvent, AgentRun, Observation } from '@abcp/types';
import { env } from '../config/index.js';
import type { ControlPlaneDriver, DriverContext, DriverResult } from './base.js';
import { DriverNotAvailableError } from './base.js';

export class BedrockAgentCoreDriver implements ControlPlaneDriver {
  public readonly name = 'bedrock-agentcore';

  canHandle(run: AgentRun): boolean {
    return run.driver === this.name;
  }

  async execute(event: ActionEvent, context: DriverContext): Promise<DriverResult> {
    if (!env.BEDROCK_AGENTCORE_GATEWAY_URL || !env.AWS_REGION) {
      if (process.env.NODE_ENV === 'test') {
        return this.simulatedResult(event, context);
      }
      throw new DriverNotAvailableError('Bedrock AgentCore configuration missing');
    }

    // TODO(jasonlovell): Implement AgentCore invocation via MCP gateway with IAM auth.

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
      dataRef: 'inline://bedrock-simulated',
      text: `Bedrock AgentCore executed action ${event.payload.type} targeting ${targetUrl}`
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
