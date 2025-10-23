import { Annotation } from '@langchain/langgraph';
import type {
  ActionEvent,
  AgentRun,
  Observation,
  PolicyDecision,
  EvidenceBundle
} from '@abcp/types';

export const ControlPlaneState = Annotation.Root({
  run: Annotation<AgentRun>(),
  actions: Annotation<ActionEvent[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),
  observations: Annotation<Observation[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),
  policyDecisions: Annotation<PolicyDecision[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),
  pendingAction: Annotation<ActionEvent | undefined>({
    reducer: (_left, right) => right,
    default: () => undefined
  }),
  evidence: Annotation<EvidenceBundle | undefined>({
    reducer: (_left, right) => right,
    default: () => undefined
  })
});

export type ControlPlaneStateType = typeof ControlPlaneState.State;
