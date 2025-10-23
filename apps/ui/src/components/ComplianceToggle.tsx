import { useState } from 'react';
import styles from './ComplianceToggle.module.css';

interface ComplianceToggleProps {
  label: string;
  description: string;
}

export function ComplianceToggle({ label, description }: ComplianceToggleProps): JSX.Element {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className={styles.container}>
      <div>
        <p className={styles.label}>{label}</p>
        <p className={styles.description}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        className={`${styles.switch} ${enabled ? styles.enabled : ''}`}
        onClick={() => setEnabled((prev) => !prev)}
      >
        <span className={styles.thumb} />
        <span className="sr-only">Toggle {label}</span>
      </button>
    </div>
  );
}
