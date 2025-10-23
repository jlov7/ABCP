# ADR 0001: Architecture and Standards Stack

- **Date:** 2024-12-01
- **Status:** Accepted
- **Context:** Establish a durable architecture for the Agentic Browser Control Plane that emphasizes observability, provenance, and interoperability while remaining clearly labeled as personal R&D.

## Decision

1. **LangGraph v1 (Node/TS)** is adopted for the control-plane runtime. We will use the SQLite checkpointer by default with optional Postgres/Redis adapters.
2. **Drivers**:
   - Gemini 2.5 Computer Use as the default server-side UI automation driver.
   - AWS Bedrock AgentCore via gateway MCP tools for enterprise integrations.
   - ChatGPT Atlas overlay driver restricted to observation (no introspection hooks).
3. **Instrumentation:** OpenTelemetry GenAI semantic conventions are mandatory for all significant spans.
4. **Provenance:** Evidence packs must embed C2PA manifests, be signed with Sigstore cosign (keyless), and log inclusion proofs via Rekor.
5. **UI Stack:** Next.js 15 + React 19 with Storybook 9, Playwright E2E, MSW mocks, and accessibility automation.
6. **Compliance Disclosure:** UI must ship toggles illustrating SB 243 companion chatbot notices and AI transparency badges.

## Consequences

- The control plane codebase is TypeScript-first with strict compiler settings (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- We accept additional complexity in CI/CD to achieve provenance attestations and security scanning but gain audit-ready artifacts.
- The Atlas driver is intentionally scoped to observation; any future introspective capabilities require a new ADR.
- The repo remains non-product R&D while conforming to product-grade engineering practices.
