# BrowserGym Evaluation Harness

This directory contains a lightweight evaluation harness for running BrowserGym benchmark tasks against the Agentic Browser Control Plane. The harness is designed to be executed via [uv](https://github.com/astral-sh/uv) for reproducible environments.

## Quickstart

```bash
cd eval/browsergym
uv sync
uv run python -m eval_runner --driver gemini-computer-use --task tasks/sample_login.json
```

## Task Format

Tasks are stored under `tasks/` as JSON files that describe the goal state, starting URL, and success criteria. The harness will invoke the control plane REST API and record BrowserGym metrics along with ABCP evidence bundles.

## Outputs

Evaluation results are written to `reports/` as JSON and CSV summaries, and provenance artifacts are stored under `reports/artifacts/` with C2PA attribution.
