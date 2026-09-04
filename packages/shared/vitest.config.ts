import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The shared layer answers for itself. Each tool tests its own models.
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
