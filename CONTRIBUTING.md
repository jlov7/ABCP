# Contributing to ABCP (Personal R&D)

> ⚠️ ABCP is a personal R&D project engineered to product-grade standards. Treat it like production-quality software, even though it is explicitly **not a product**.

## Getting Started

1. **Install prerequisites**
   - Node.js `>=20.17`
   - PNPM `>=9`
   - Docker (optional) for Playwright browsers
   - Python `>=3.11` (managed via `uv`)
2. **Bootstrap the workspace**
   ```bash
   pnpm install
   pnpm exec turbo run build --filter=types
   ```
3. **Dev containers** — open the repo in VS Code and select the provided `.devcontainer` for a fully provisioned environment (browsers, cosign, uv).

## Pull Request Process

- Execute `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm coverage` before submitting.
- For UI changes, run `pnpm --filter ui storybook` and attach relevant screenshots or Percy/Chromatic diffs.
- Include evidence bundles (`pnpm --filter control-plane evidence:bundle`) when touching provenance logic.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) and document design decisions in `/ADR`.
- New features must ship with:
  - Unit tests (≥85% line coverage; critical paths ≥95%).
  - Accessibility validation (axe, keyboard navigation).
  - OpenTelemetry spans using GenAI semantic conventions.
  - Provenance credentials (C2PA manifests + cosign attestations).

## Communication

- File issues for bugs, proposed features, or design discussions.
- Use the `security` advisory flow for vulnerabilities (see `SECURITY.md`).
- Decisions lasting longer than one milestone require an Architecture Decision Record in `ADR/`.

## Local Tooling

- **Lefthook** runs Prettier and scoped type checks pre-commit.
- **Task scripts** (e.g., `pnpm dev`, `pnpm e2e`, `pnpm eval:webarena`) provide one-liners for common workflows.
- **Playwright traces** are captured automatically during E2E runs and stored in `trace-results/`.

## Assumptions & Boundaries

- The project never bypasses authentication, bot detection, or access controls.
- Atlas driver is strictly observational with annotated disclaimers.
- Evidence bundles are redacted to avoid storing sensitive user data.
- Compliance toggles illustrate SB 243 and AI transparency obligations but are not legal advice.

Thank you for helping build a trustworthy, standards-first agentic control plane!
