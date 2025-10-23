from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

import httpx
import typer


app = typer.Typer(help="WebArena evaluation harness for the Agentic Browser Control Plane")


def _load_suite(path: Path) -> Dict[str, Any]:
  with path.open('r', encoding='utf-8') as handle:
    return json.load(handle)


@app.command()
def run(
  suite: Path = typer.Argument(..., help='Path to WebArena suite JSON'),
  driver: str = typer.Option('gemini-computer-use', help='Control plane driver'),
  control_plane_url: str = typer.Option('http://localhost:4000', help='Control plane base URL'),
  reports_dir: Path = typer.Option(Path('reports'), help='Directory to store reports')
) -> None:
  """Execute a WebArena-style task list via the control plane."""

  suite_data = _load_suite(suite)
  reports_dir.mkdir(parents=True, exist_ok=True)

  with httpx.Client(base_url=control_plane_url, timeout=30.0) as client:
    results = []
    for task in suite_data.get('tasks', []):
      run_response = client.post('/runs', json={'driver': driver})
      run_response.raise_for_status()
      run_id = run_response.json()['run']['id']

      action_id = str(uuid4())
      timestamp = datetime.utcnow().isoformat() + 'Z'

      action_payload = {
        'id': action_id,
        'runId': run_id,
        'sequence': 0,
        'timestamp': timestamp,
        'agent': {
          'id': str(uuid4()),
          'name': 'WebArena Harness',
          'driver': driver
        },
        'context': {
          'idempotencyKey': str(uuid4())
        },
        'target': {
          'url': task.get('startUrl')
        },
        'payload': {
          'type': 'navigate'
        },
        'status': 'planned'
      }

      client.post(f'/runs/{run_id}/actions', json=action_payload).raise_for_status()
      summary = client.get(f'/runs/{run_id}/summary').json()

      observations = summary.get('observations', [])
      texts = [obs.get('text', '').lower() for obs in observations]
      success_phrase = task.get('successPhrase', '').lower()
      success = success_phrase and any(success_phrase in text for text in texts)

      results.append({
        'taskId': task.get('id'),
        'runId': run_id,
        'success': bool(success),
        'observations': observations,
        'evidence': summary.get('evidence')
      })

  report_path = reports_dir / f"webarena_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.json"
  with report_path.open('w', encoding='utf-8') as handle:
    json.dump(results, handle, indent=2)

  csv_path = reports_dir / 'webarena_summary.csv'
  write_header = not csv_path.exists()
  with csv_path.open('a', newline='', encoding='utf-8') as csv_file:
    writer = csv.DictWriter(csv_file, fieldnames=['taskId', 'runId', 'success'])
    if write_header:
      writer.writeheader()
    for entry in results:
      writer.writerow({
        'taskId': entry['taskId'],
        'runId': entry['runId'],
        'success': entry['success']
      })

  typer.echo(f"Completed {len(results)} WebArena tasks • report={report_path}")


if __name__ == '__main__':
  app()
