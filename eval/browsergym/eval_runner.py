from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from uuid import uuid4

import httpx
import typer


app = typer.Typer(help="BrowserGym evaluation harness for the Agentic Browser Control Plane")


def _load_task(path: Path) -> Dict[str, Any]:
  with path.open('r', encoding='utf-8') as f:
    return json.load(f)


def _success_from_observations(observations: List[Dict[str, Any]], criteria: List[str]) -> bool:
  texts = [obs.get('text', '') for obs in observations]
  lowered = [text.lower() for text in texts]

  def criterion_met(criterion: str) -> bool:
    target = criterion.lower()
    return any(target in text for text in lowered)

  return all(criterion_met(criterion) for criterion in criteria)


@app.command()
def run(
  task: Path = typer.Argument(..., help='Path to BrowserGym task JSON'),
  driver: str = typer.Option('gemini-computer-use', help='Control plane driver identifier'),
  control_plane_url: str = typer.Option('http://localhost:4000', help='Control plane base URL'),
  reports_dir: Path = typer.Option(Path('reports'), help='Directory for evaluation artifacts')
) -> None:
  """Execute a BrowserGym task via the control plane's REST API."""

  data = _load_task(task)
  reports_dir.mkdir(parents=True, exist_ok=True)

  with httpx.Client(base_url=control_plane_url, timeout=30.0) as client:
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
        'name': 'BrowserGym Harness',
        'driver': driver
      },
      'context': {
        'idempotencyKey': str(uuid4())
      },
      'target': {
        'url': data.get('startUrl')
      },
      'payload': {
        'type': 'navigate'
      },
      'status': 'planned'
    }

    action_response = client.post(f'/runs/{run_id}/actions', json=action_payload)
    action_response.raise_for_status()

    summary_response = client.get(f'/runs/{run_id}/summary')
    summary_response.raise_for_status()
    summary = summary_response.json()

  observations = summary.get('observations', [])
  success = _success_from_observations(observations, data.get('successCriteria', []))

  report = {
    'taskId': data.get('id'),
    'runId': run_id,
    'driver': driver,
    'timestamp': timestamp,
    'success': success,
    'criteria': data.get('successCriteria', []),
    'observations': observations,
    'evidence': summary.get('evidence')
  }

  report_path = reports_dir / f"{data.get('id')}_{run_id}.json"
  with report_path.open('w', encoding='utf-8') as handle:
    json.dump(report, handle, indent=2)

  csv_path = reports_dir / 'summary.csv'
  file_exists = csv_path.exists()
  with csv_path.open('a', newline='', encoding='utf-8') as csv_file:
    writer = csv.DictWriter(csv_file, fieldnames=['taskId', 'runId', 'driver', 'timestamp', 'success'])
    if not file_exists:
      writer.writeheader()
    writer.writerow({
      'taskId': report['taskId'],
      'runId': report['runId'],
      'driver': report['driver'],
      'timestamp': report['timestamp'],
      'success': report['success']
    })

  typer.echo(f"Run {run_id} complete • success={success} • report={report_path}")


if __name__ == '__main__':
  app()
