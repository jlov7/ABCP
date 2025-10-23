import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import { basename, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import archiver from 'archiver';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { evidenceArtifactSchema, evidenceBundleSchema } from '@abcp/types';

export interface BundleArtifactInput {
  path: string;
  type: z.infer<typeof evidenceArtifactSchema>['type'];
  contentType: string;
  c2paManifest?: Record<string, unknown>;
}

export interface BundleOptions {
  runId: string;
  outputDir?: string;
  metadata?: Record<string, string | number | boolean>;
  embedC2paManifests?: boolean;
}

export interface BundleResult {
  manifestPath: string;
  bundlePath: string;
  bundle: z.infer<typeof evidenceBundleSchema>;
}

const ensureDirectory = async (dir: string): Promise<void> => {
  await fsp.mkdir(dir, { recursive: true });
};

const computeSha256 = async (path: string): Promise<string> => {
  const hash = createHash('sha256');
  const stream = fs.createReadStream(path);
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve());
    stream.on('error', (error) => reject(error));
  });
  return hash.digest('hex');
};

const writeManifest = async (
  artifacts: z.infer<typeof evidenceArtifactSchema>[],
  manifestPath: string,
  metadata?: Record<string, string | number | boolean>
): Promise<void> => {
  const manifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    artifacts,
    metadata: metadata ?? {}
  };

  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
};

const writeC2paManifest = async (artifactPath: string, manifest: Record<string, unknown>) => {
  const manifestPath = `${artifactPath}.c2pa.json`;
  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  return manifestPath;
};

export const createEvidenceBundle = async (
  artifacts: BundleArtifactInput[],
  options: BundleOptions
): Promise<BundleResult> => {
  const bundleId = randomUUID();
  const runId = options.runId;
  const outputDir = options.outputDir ?? join(tmpdir(), 'abcp-evidence');
  await ensureDirectory(outputDir);

  const manifestArtifacts: z.infer<typeof evidenceArtifactSchema>[] = [];

  for (const artifact of artifacts) {
    const stats = await fsp.stat(artifact.path);
    const sha256 = await computeSha256(artifact.path);
    let c2paManifestPath: string | undefined;
    if (options.embedC2paManifests && artifact.c2paManifest) {
      c2paManifestPath = await writeC2paManifest(artifact.path, artifact.c2paManifest);
    }

    manifestArtifacts.push({
      id: randomUUID(),
      type: artifact.type,
      contentType: artifact.contentType,
      path: artifact.path,
      sha256,
      sizeBytes: stats.size,
      c2paManifestPath
    });
  }

  const manifestPath = join(outputDir, `${bundleId}-manifest.json`);
  await writeManifest(manifestArtifacts, manifestPath, options.metadata);

  const bundlePath = join(outputDir, `${bundleId}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(bundlePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (error) => reject(error));
    archive.pipe(output);

    archive.append(fs.createReadStream(manifestPath), { name: 'manifest.json' });

    for (const artifact of manifestArtifacts) {
      archive.file(artifact.path, { name: `artifacts/${basename(artifact.path)}` });
      if (artifact.c2paManifestPath) {
        archive.file(artifact.c2paManifestPath, {
          name: `artifacts/${basename(artifact.c2paManifestPath)}`
        });
      }
    }

    void archive.finalize();
  });

  const bundleData = {
    id: bundleId,
    runId,
    createdAt: new Date().toISOString(),
    artifacts: manifestArtifacts,
    manifestHash: await computeSha256(manifestPath)
  };

  const parsedBundle = evidenceBundleSchema.parse(bundleData);

  return {
    manifestPath,
    bundlePath,
    bundle: parsedBundle
  };
};
