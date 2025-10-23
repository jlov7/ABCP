import { randomUUID } from 'node:crypto';
import type { ActionEvent, PolicyDecision } from '@abcp/types';

export interface PolicyContext {
  sensitiveDomains?: string[];
}

export interface PolicyRule {
  name: string;
  evaluate(action: ActionEvent, context: PolicyContext): PolicyDecision | null;
}

const createAllowDecision = (action: ActionEvent, reason: string): PolicyDecision => ({
  id: randomUUID(),
  runId: action.runId,
  actionId: action.id,
  policyId: 'policy::baseline-allow',
  verdict: 'allow',
  timestamp: new Date().toISOString(),
  reason
});

const baselineRule: PolicyRule = {
  name: 'baseline-allow',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  evaluate(action: ActionEvent, _context: PolicyContext): PolicyDecision {
    return createAllowDecision(action, 'Baseline allow rule');
  }
};

const sensitiveNavigationRule = (sensitiveDomains: string[]): PolicyRule => ({
  name: 'sensitive-navigation',
  evaluate(action: ActionEvent, context: PolicyContext): PolicyDecision | null {
    if (action.payload.type !== 'navigate') {
      return null;
    }

    const targetUrl = action.target.url ?? '';
    const domains = context.sensitiveDomains ?? sensitiveDomains;
    const matchesSensitive = domains.some((domain) => targetUrl.includes(domain));
    if (!matchesSensitive) {
      return null;
    }

    return {
      id: randomUUID(),
      runId: action.runId,
      actionId: action.id,
      timestamp: new Date().toISOString(),
      policyId: 'policy::sensitive-navigation',
      verdict: 'requires-approval',
      reason: `Navigation to sensitive domain requires approval: ${targetUrl}`
    };
  }
});

export class PolicyEngine {
  private readonly rules: PolicyRule[];
  private readonly context: PolicyContext;

  constructor(context: PolicyContext = {}) {
    const sensitiveDomains = context.sensitiveDomains ?? [];
    this.rules = [baselineRule, sensitiveNavigationRule(sensitiveDomains)];
    this.context = context;
  }

  evaluate(action: ActionEvent): PolicyDecision {
    for (const rule of this.rules) {
      const decision = rule.evaluate(action, this.context);
      if (decision) {
        return decision;
      }
    }

    return createAllowDecision(action, 'Default allow');
  }
}
