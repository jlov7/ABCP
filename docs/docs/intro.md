# Agentic Browser Control Plane (R&D)

> **Personal R&D project — not a product.**

This documentation describes the research-grade control plane that observes, explains, and governs agentic browser actions. It focuses on interoperability (MCP-first tooling), provenance (C2PA + cosign + Rekor), and accessibility guardrails.

## Architecture Overview

- **Control plane runtime:** LangGraph v1 with SQLite (via `sql.js`) checkpointing, policy hooks, and OpenTelemetry GenAI spans.
- **Drivers:** Gemini Computer Use, AWS Bedrock AgentCore (MCP gateway), and ChatGPT Atlas overlay (observational).
- **Evidence packs:** Structured DOM/HAR/screenshot captures bundled and signed with C2PA manifests, cosign keyless, and Rekor inclusion proofs.
- **UI:** Next.js 15 + React 19 dashboard with Storybook stories, accessibility checks, and compliance toggles.

## Key Capabilities

- Policy engine with allow/deny/approval verdicts surfaced to the UI and telemetry spans.
- Evidence bundler CLI for verifying provenance with `pnpm evidence:verify`.
- Evaluation harnesses for BrowserGym and WebArena via `uv` environments.
- Compliance toggles for California SB 243 disclosures and AI transparency messaging (demo-only, not legal advice).

## Getting Started

```bash
pnpm install
pnpm --filter @abcp/control-plane dev
pnpm --filter @abcp/ui dev
```

Telemetry can be enabled by setting `OTEL_EXPORTER_OTLP_ENDPOINT` and providing the required API credentials for the selected driver.
