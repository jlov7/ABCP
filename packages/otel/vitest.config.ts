import { defineConfig } from 'vitest/config';

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
  }
});
