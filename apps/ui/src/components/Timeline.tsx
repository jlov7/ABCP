import type { ActionEvent, Observation, PolicyDecision } from '@abcp/types';
import styles from './Timeline.module.css';

export interface TimelineProps {
  actions: ActionEvent[];
  observations: Observation[];
  decisions: PolicyDecision[];
}

export function Timeline({ actions, observations, decisions }: TimelineProps): JSX.Element {
  const events = actions.map((action) => {
    const decision = decisions.find((item) => item.actionId === action.id);
    const observation = observations.find((item) => item.actionId === action.id);

    return {
      action,
      decision,
      observation
    };
  });

  return (
    <section aria-label="Agent timeline" className={styles.timeline}>
      <h2>Timeline</h2>
      <ol className={styles.list}>
        {events.map(({ action, decision, observation }) => (
          <li key={action.id} className={styles.item}>
            <header className={styles.itemHeader}>
              <span className={styles.badge}>{action.payload.type}</span>
              <div>
                <strong>{action.payload.type.toUpperCase()}</strong>
                <time dateTime={action.timestamp}>
                  {new Date(action.timestamp).toLocaleString()}
                </time>
              </div>
            </header>
            <dl className={styles.details}>
              <div>
                <dt>Agent</dt>
                <dd>{action.agent.name}</dd>
              </div>
              {decision && (
                <div>
                  <dt>Policy Verdict</dt>
                  <dd>{decision.verdict}</dd>
                </div>
              )}
              {observation && (
                <div>
                  <dt>Observation</dt>
                  <dd>{observation.text ?? 'Captured artifact'}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
