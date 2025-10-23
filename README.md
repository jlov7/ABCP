# Agentic Browser Control Plane (ABCP — Personal R&D)

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
