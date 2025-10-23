import { afterEach, describe, expect, it } from 'vitest';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createEvidenceBundle } from './bundle';

const tempFiles: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempFiles.map(async (file) => {
      try {
        await fsp.unlink(file);
      } catch {
        // ignore
      }
    })
  );
  tempFiles.length = 0;
});

const createTempFile = async (content: string): Promise<string> => {
  const path = join(tmpdir(), `${Math.random().toString(36).slice(2)}.txt`);
  await fsp.writeFile(path, content, 'utf8');
  tempFiles.push(path);
  return path;
};

describe('createEvidenceBundle', () => {
  it('bundles artifacts and produces manifest', async () => {
    const artifactPath = await createTempFile('hello');
    const { bundlePath, manifestPath, bundle } = await createEvidenceBundle(
      [
        {
          path: artifactPath,
          type: 'log',
          contentType: 'text/plain',
          c2paManifest: { producer: 'test' }
        }
      ],
      {
        runId: '7e3eab2e-733f-4632-82f3-4fc7b5871a91',
        embedC2paManifests: true,
        metadata: { key: 'value' }
      }
    );

    expect(bundle.artifacts).toHaveLength(1);
    expect(bundlePath.endsWith('.zip')).toBe(true);
    expect(manifestPath.endsWith('.json')).toBe(true);
    const manifestContent = await fsp.readFile(manifestPath, 'utf8');
    expect(manifestContent).toContain('artifacts');
  });
});
