import styles from './ProvenanceBadge.module.css';

interface ProvenanceBadgeProps {
  evidenceAvailable: boolean;
}

export function ProvenanceBadge({ evidenceAvailable }: ProvenanceBadgeProps): JSX.Element {
  return (
    <span
      className={styles.badge}
      aria-label={evidenceAvailable ? 'Provenance evidence available' : 'Evidence pending'}
    >
      {evidenceAvailable ? 'Content Credentials Verified' : 'Evidence Pending'}
    </span>
  );
}
