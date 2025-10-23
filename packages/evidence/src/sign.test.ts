import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from 'http';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createEvidenceBundle } from './bundle';
import {
  downloadEvidenceBundle,
  publishRekorEntry,
  signEvidenceBundle,
  verifyEvidenceBundle
} from './sign';

const cleanup: string[] = [];

const createTempFile = async (content: string): Promise<string> => {
  const path = join(tmpdir(), `${randomUUID()}.txt`);
  await fsp.writeFile(path, content, 'utf8');
  cleanup.push(path);
  return path;
};

afterEach(async () => {
  await Promise.all(
    cleanup.map(async (file) => {
      try {
        await fsp.unlink(file);
      } catch {
        // ignore
      }
    })
  );
  cleanup.length = 0;
});

let server: ReturnType<typeof createServer>;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(async (req, res) => {
    if (req.url === '/bundle.zip') {
      const file = join(tmpdir(), 'fake-bundle.zip');
      await fsp.writeFile(file, 'bundle', 'utf8');
      cleanup.push(file);
      const content = await fsp.readFile(file);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': content.length
      });
      res.end(content);
      return;
    }

    if (req.url === '/api/v1/log/entries' && req.method === 'POST') {
      res.writeHead(201, {
        Location: 'https://rekor.example.com/api/v1/log/entries/123'
      });
      res.end('{}');
      return;
    }

    res.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const createFakeCosignBinary = async () => {
  const path = join(tmpdir(), `cosign-${randomUUID()}.js`);
  const script = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
if (args.includes('attest')) {
  const output = args[outputIndex + 1];
  fs.writeFileSync(output, JSON.stringify({ authenticated: true }), 'utf8');
  process.exit(0);
}
if (args.includes('verify-attestation')) {
  const bundleIndex = args.indexOf('--bundle');
  const output = args[outputIndex + 1];
  fs.writeFileSync(output, '{"authenticated": true}', 'utf8');
  process.exit(0);
}
process.exit(1);
`;
  await fsp.writeFile(path, script, { mode: 0o755 });
  cleanup.push(path);
  return path;
};

describe('signEvidenceBundle', () => {
  it('signs and verifies bundle using fake cosign', async () => {
    const artifact = await createTempFile('hello');
    const { bundlePath } = await createEvidenceBundle(
      [
        {
          path: artifact,
          type: 'log',
          contentType: 'text/plain'
        }
      ],
      {
        runId: randomUUID()
      }
    );

    cleanup.push(bundlePath);
    const fakeCosign = await createFakeCosignBinary();
    const signResult = await signEvidenceBundle({
      bundlePath,
      cosignBinary: fakeCosign,
      rekorUrl: `${baseUrl}/api/v1/log/entries`
    });

    expect(signResult.attestationPath).toBeTruthy();
    cleanup.push(signResult.attestationPath);

    const verified = await verifyEvidenceBundle({
      bundlePath,
      attestationPath: signResult.attestationPath,
      cosignBinary: fakeCosign
    });

    expect(verified).toBe(true);
  });
});

describe('publishRekorEntry', () => {
  it('returns entry URL', async () => {
    const attestation = await createTempFile('{}');
    const result = await publishRekorEntry({
      attestationPath: attestation,
      rekorUrl: `${baseUrl}`
    });
    expect(result.rekorEntryUrl).toContain('rekor.example.com');
  });
});

describe('downloadEvidenceBundle', () => {
  it('downloads file', async () => {
    const destination = join(tmpdir(), `download-${randomUUID()}.zip`);
    cleanup.push(destination);
    await downloadEvidenceBundle({
      url: `${baseUrl}/bundle.zip`,
      destination
    });
    const stats = await fsp.stat(destination);
    expect(stats.size).toBeGreaterThan(0);
  });
});
