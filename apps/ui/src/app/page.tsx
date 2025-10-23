import { Timeline } from '@/components/Timeline';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { ComplianceToggle } from '@/components/ComplianceToggle';
import { createMockTimelineData } from '@/utils/mockData';
import styles from './page.module.css';

export default function Home(): JSX.Element {
  const data = createMockTimelineData();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>Agentic Browser Control Plane</h1>
          <p className={styles.tagline}>Personal R&D • Observability • Provenance • Accessibility</p>
        </div>
        <ProvenanceBadge evidenceAvailable={data.evidenceAvailable} />
      </header>

      <section className={styles.grid}>
        <Timeline
          actions={data.actions}
          observations={data.observations}
          decisions={data.decisions}
        />
        <aside className={styles.sidebar} aria-label="Compliance toggles">
          <h2>Compliance Toggles</h2>
          <ComplianceToggle
            label="SB 243 Disclosure"
            description="Display AI disclosure banner and minors safeguards for demo flows."
          />
          <ComplianceToggle
            label="AI Transparency Badges"
            description="Show provenance badge and download evidence pack links."
          />
        </aside>
      </section>
    </main>
  );
}
