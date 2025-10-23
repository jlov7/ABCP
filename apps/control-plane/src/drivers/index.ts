import type { AgentRun, ActionEvent } from '@abcp/types';
import { GeminiComputerUseDriver } from './gemini.js';
import { BedrockAgentCoreDriver } from './bedrock.js';
import { AtlasOverlayDriver } from './atlas.js';
import type { ControlPlaneDriver, DriverContext, DriverResult } from './base.js';
import { DriverNotAvailableError } from './base.js';

const drivers: ControlPlaneDriver[] = [
  new GeminiComputerUseDriver(),
  new BedrockAgentCoreDriver(),
  new AtlasOverlayDriver()
];

export const resolveDriver = (run: AgentRun): ControlPlaneDriver => {
  const driver = drivers.find((candidate) => candidate.canHandle(run));
  if (!driver) {
    throw new DriverNotAvailableError(`No driver registered for ${run.driver}`);
  }
  return driver;
};

export const executeWithDriver = async (
  event: ActionEvent,
  context: DriverContext
): Promise<DriverResult> => {
  const driver = resolveDriver(context.run);
  return driver.execute(event, context);
};

export { DriverNotAvailableError } from './base.js';
