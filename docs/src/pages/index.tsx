import Layout from '@theme/Layout';

export default function Home(): JSX.Element {
  return (
    <Layout title="Agentic Browser Control Plane" description="Personal R&D control plane">
      <main className="hero">
        <div className="container">
          <h1>Agentic Browser Control Plane</h1>
          <p className="subtitle">Personal R&D · Standards-first · Provenance-attested</p>
          <div className="cta">
            <a className="button button--primary" href="/docs/intro">
              Read the docs
            </a>
            <a className="button button--secondary" href="https://github.com">
              View repository
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}
