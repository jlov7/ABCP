import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));
const resolvePath = (relativePath: string) => join(rootDir, relativePath);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
      all: true,
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 0.9,
        branches: 0.85,
        functions: 0.9,
        lines: 0.9
      }
    }
  },
  resolve: {
    alias: [
      {
        find: /^@abcp\/types$/,
        replacement: resolvePath('../types/src/index.ts')
      },
      {
        find: /^@abcp\/types\/(.*)$/,
        replacement: resolvePath('../types/src/$1')
      }
    ]
  }
});
