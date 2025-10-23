import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fetch from 'node-fetch';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { URL } from 'node:url';

export interface SignOptions {
  cosignBinary?: string;
  identityToken?: string;
  rekorUrl?: string;
  bundlePath: string;
  outputBundlePath?: string;
}

export interface SignResult {
  attestationPath: string;
  rekorEntryUrl?: string;
}

const runCommand = async (command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env
      }
    });

    child.on('error', (error) => reject(error));
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} exited with status ${code}`));
      }
    });
  });

export const signEvidenceBundle = async (options: SignOptions): Promise<SignResult> => {
  const cosignBinary = options.cosignBinary ?? 'cosign';
  const attestationPath =
    options.outputBundlePath ?? join(tmpdir(), `abcp-evidence-${randomUUID()}.intoto.jsonl`);

  const args = ['attest', '--type', 'abcp-evidence', '--predicate', options.bundlePath, '--upload=false'];

  if (options.identityToken) {
    args.push('--identity-token', options.identityToken);
  }

  if (options.rekorUrl) {
    args.push('--rekor-url', options.rekorUrl);
  }

  args.push('--output', attestationPath);

  await runCommand(cosignBinary, args);

  return {
    attestationPath,
    rekorEntryUrl: options.rekorUrl
  };
};

export interface RekorPublishOptions {
  attestationPath: string;
  rekorUrl?: string;
}

export const publishRekorEntry = async (
  options: RekorPublishOptions
): Promise<{ rekorEntryUrl: string }> => {
  const rekorUrl = options.rekorUrl ?? 'https://rekor.sigstore.dev';
  const url = new URL('/api/v1/log/entries', rekorUrl);

  const response = await fetch(url, {
    method: 'POST',
    body: await fsp.readFile(options.attestationPath),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to publish Rekor entry: ${response.status} ${body}`);
  }

  const headers = response.headers.get('Location');
  if (!headers) {
    throw new Error('Rekor did not return a Location header.');
  }

  return { rekorEntryUrl: headers };
};

export interface VerifyOptions {
  cosignBinary?: string;
  bundlePath: string;
  attestationPath: string;
}

export const verifyEvidenceBundle = async (options: VerifyOptions): Promise<boolean> => {
  const cosignBinary = options.cosignBinary ?? 'cosign';
  const outputPath = join(tmpdir(), `abcp-verify-${randomUUID()}.txt`);
  await runCommand(cosignBinary, [
    'verify-attestation',
    '--type',
    'abcp-evidence',
    '--predicate',
    options.bundlePath,
    '--bundle',
    options.attestationPath,
    '--output',
    outputPath
  ]);

  const content = await fsp.readFile(outputPath, 'utf8');
  return content.includes('"authenticated": true');
};

export interface EvidenceDownloadOptions {
  url: string;
  destination: string;
}

export const downloadEvidenceBundle = async (options: EvidenceDownloadOptions): Promise<void> => {
  const response = await fetch(options.url);
  if (!response.ok) {
    throw new Error(`Failed to download evidence bundle: ${response.status}`);
  }

  await pipeline(response.body, createWriteStream(options.destination));
};
