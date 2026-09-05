import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The roster answers for itself.
    include: ['*.test.ts'],
    environment: 'node',
  },
});
