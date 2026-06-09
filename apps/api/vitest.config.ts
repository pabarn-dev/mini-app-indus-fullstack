import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Integration tests (require the DB) run via vitest.integration.config.ts.
    exclude: [...configDefaults.exclude, '**/*.integration.spec.ts'],
  },
});
