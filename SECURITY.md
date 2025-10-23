# Security Policy

## Reporting a Vulnerability

ABCP (Agentic Browser Control Plane) is a personal R&D project engineered to product-grade standards. If you believe you have found a security vulnerability, please open a confidential security advisory on GitHub or email `security@abcp.dev`. Provide as much detail as possible so the issue can be reproduced quickly.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main`  | ✅ |
| Others  | ❌ |

Binaries and containers are not distributed. All security fixes land on `main` and are released through signed provenance attestations.

## Security Principles

- **Least Privilege:** Drivers and tools ship with explicit allow/deny policy gates and IAM-scoped secrets.
- **Observability:** Every action is traced with OpenTelemetry GenAI semantic conventions for auditability.
- **Provenance:** All evidence bundles include C2PA manifests, cosign signatures, and Rekor transparency log entries.
- **Redaction:** Sensitive selectors, DOM nodes, and logs are masked by default in packaged artifacts.
- **Human-in-the-Loop:** Automation halts for authentication walls, CAPTCHAs, or policy violations. The code NEVER attempts to bypass access controls.

## Disclosure Timeline

Vulnerabilities will be acknowledged within five (5) business days. A fix or mitigation plan will be published within thirty (30) days, along with verification steps and updated provenance attestations.
