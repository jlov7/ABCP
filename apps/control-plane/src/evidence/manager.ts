import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { Observation, EvidenceBundle } from '@abcp/types';
import { createEvidenceBundle } from '@abcp/evidence';

interface EvidenceOptions {
  runId: string;
}

export class EvidenceManager {
  async createBundle(observations: Observation[], options: EvidenceOptions): Promise<EvidenceBundle> {
    const artifacts = await Promise.all(
      observations.map(async (observation) => {
        const artifactPath = await this.writeObservation(observation);
        return {
          path: artifactPath,
          type: 'log' as const,
          contentType: 'application/json'
        };
      })
    );

    const { bundle } = await createEvidenceBundle(artifacts, {
      runId: options.runId,
      embedC2paManifests: false,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    });

    return bundle;
  }

  private async writeObservation(observation: Observation): Promise<string> {
    const dir = join(tmpdir(), 'abcp-evidence');
    await fsp.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${observation.id}.json`);
    const payload = JSON.stringify(observation, null, 2);
    await fsp.writeFile(filePath, payload, 'utf8');
    return filePath;
  }
}
