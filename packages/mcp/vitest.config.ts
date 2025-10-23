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
        statements: 0.85,
        branches: 0.8,
        functions: 0.85,
        lines: 0.85
      }
    }
  }
});
