# WebArena Evaluation Harness

This harness wraps WebArena benchmark tasks to evaluate end-to-end agent runs with the Agentic Browser Control Plane. Use `uv` to manage the Python environment.

```bash
cd eval/webarena
uv sync
uv run python -m eval_runner --suite minimal
```

Results are exported to `reports/` and include latency metrics, success/failure breakdown, and links to ABCP evidence bundles.
