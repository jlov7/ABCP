# Agentic Browser Control Plane (ABCP — Personal R&D)

[![CI](https://github.com/jlov7/ABCP/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![CodeQL](https://github.com/jlov7/ABCP/actions/workflows/codeql.yml/badge.svg)](../../actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/jlov7/ABCP/actions/workflows/scorecard.yml/badge.svg)](../../actions/workflows/scorecard.yml)
[![Docs](https://github.com/jlov7/ABCP/actions/workflows/docs.yml/badge.svg)](../../actions/workflows/docs.yml)
[![Storybook](https://github.com/jlov7/ABCP/actions/workflows/storybook.yml/badge.svg)](../../actions/workflows/storybook.yml)

> **Personal R&D. Not a product.**  
> ABCP is an engineering playground for building a standards-first control plane that observes, explains, and governs agentic browser actions across Gemini Computer Use, AWS Bedrock AgentCore, and ChatGPT Atlas overlay surfaces.

## Vision

1. **Explainability you can hand to Audit** — OpenTelemetry spans, structured policies, and signed evidence bundles.
2. **Interoperability that survives platform churn** — MCP-native drivers, modular tool adapters, and langgraph orchestration.
3. **Reproducibility** — Golden traces from BrowserGym/WebArena, Playwright trace viewer artifacts, and deterministic env controls.

## Repo Layout

```
apps/
  control-plane/   # LangGraph runtime, drivers, policy hooks
  ui/              # Next.js 15 app, Storybook, accessibility tooling
packages/
  types/           # Shared Zod schemas and TypeScript contracts
  otel/            # OpenTelemetry GenAI helpers
  mcp/             # MCP clients + sample servers
  evidence/        # C2PA embeds, cosign signing, Rekor proofs
eval/              # BrowserGym/WebArena harness + golden traces
docs/              # Docusaurus documentation site
.github/workflows/ # CI/CD pipelines (lint, tests, a11y, provenance)
```

## Quickstart

```bash
pnpm install
pnpm dev
```

- `apps/control-plane`: `pnpm --filter control-plane dev`
- `apps/ui`: `pnpm --filter ui dev`
- `docs`: `pnpm --filter docs docs:dev`

## REST API Highlights

- `POST /runs` — create a new agent run (supply `driver`)
- `POST /runs/:runId/actions` — submit an action event for execution
- `GET /runs/:runId/summary` — aggregate run metadata, policy decisions, observations, and evidence bundle pointers in a single response

## Evaluation Harnesses

Run reproducible BrowserGym/WebArena suites via `uv`:

```bash
# BrowserGym
cd eval/browsergym
uv sync
uv run python -m eval_runner tasks/sample_login.json

# WebArena
cd ../webarena
uv sync
uv run python -m eval_runner --suite tasks/sample_suite.json
```

## Ethos & Guardrails

- **Prime directives:** correctness & tests → security & provenance → accessibility & UX → maintainability → performance.
- **Observational Atlas driver:** captures DOM/network evidence only; no introspection hooks.
- **Compliance toggles:** demonstrate California SB 243 (Companion Chatbot) and AI transparency disclosures.
- **Provenance:** Every evidence pack includes C2PA manifests, cosign signatures, and Rekor inclusion proofs.
- **Accessibility:** Storybook a11y, keyboard-first navigation, and WCAG 2.2 automation in CI.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md).  
All commits follow Conventional Commits and ship with tests, spans, and provenance updates.

## Citation

If you build on this work for research, cite using the metadata in [`CITATION.cff`](CITATION.cff).
