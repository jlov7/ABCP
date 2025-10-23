import { defineConfig } from 'vitest/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const resolvePath = (relative: string) => join(rootDir, relative);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 0.85,
        branches: 0.8,
        functions: 0.85,
        lines: 0.85
      }
    }
  },
  resolve: {
    alias: [
      { find: /^@abcp\/types$/, replacement: resolvePath('../../packages/types/src/index.ts') },
      { find: /^@abcp\/types\/(.*)$/, replacement: resolvePath('../../packages/types/src/$1') },
      { find: /^@abcp\/otel$/, replacement: resolvePath('../../packages/otel/src/index.ts') },
      { find: /^@abcp\/mcp$/, replacement: resolvePath('../../packages/mcp/src/index.ts') },
      { find: /^@abcp\/evidence$/, replacement: resolvePath('../../packages/evidence/src/index.ts') }
    ]
  }
});
