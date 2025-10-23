import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    reporters: ['default'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
      all: true,
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 0.95,
        branches: 0.9,
        functions: 0.95,
        lines: 0.95
      }
    }
  }
});
