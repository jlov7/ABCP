# Troubleshooting Guide

This decision tree helps diagnose common issues in the Agentic Browser Control Plane (Personal R&D).

## 1. Selectors or Actions Fail

- ✅ **Check Playwright traces**: `pnpm --filter control-plane e2e -- --trace on`
- ✅ **Use locator healer**: ensure roles/labels/ARIA hints are available; fallback to CSS selectors as last resort.
- 🔄 **Enable chaos toggles**: `PNPM_CHROMIUM_CHAOS=true pnpm --filter control-plane test` to reproduce flaky behavior.

## 2. Auth or CAPTCHA Roadblocks

- 🧑‍💼 Automation must halt for human approval. Ensure HITL prompts are configured in policy hooks.
- 🔐 Store temporary credentials in a secure secret manager; never commit secrets.
- 👍 Document the manual step in the run log for auditability.

## 3. Network Flakiness / Timeouts

- ⏱ Verify timeouts in driver configs (`driver-gemini-cu`, `driver-bedrock-agentcore`).
- 📦 Use HAR captures from the evidence pack to inspect responses.
- 🔁 Retry with exponential backoff; align with policy thresholds.

## 4. Evidence Bundle Issues

- 🧾 Run `pnpm --filter packages/evidence exec evidence:verify <path>` to validate signatures.
- 🔐 Ensure `COSIGN_EXPERIMENTAL=1` for keyless signing.
- 🌐 Confirm Rekor endpoint is reachable; offline mode stores proofs locally until reconnect.

## 5. Observability Gaps

- 📈 Verify OTLP endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT`) is reachable.
- ✅ Ensure GenAI attributes (`genai.system`, `genai.operation.name`) are set in spans.
- 🔍 Use `pnpm --filter packages/otel test` to validate instrumentation helpers.

## 6. UI Discrepancies

- 🧪 Run Storybook visual tests: `pnpm --filter ui storybook:test`.
- 🔎 Inspect visual diff artifacts in `apps/ui/__diffs__`.
- ♿ Validate keyboard navigation (`pnpm --filter ui test:a11y`).

## 7. Eval Regressions

- 📂 Compare golden traces in `eval/*/golden`.
- 🧪 Execute targeted evals: `pnpm eval:webarena --task login`.
- 🔁 Regenerate golden data only after reviews; include provenance notes.

## Need More Help?

Open an issue with reproduction steps, logs, trace bundles, and evidence verification output. Include environment details (Node, pnpm, OS, browser version).
