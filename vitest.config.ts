import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only the calculation layer is unit tested here. Browser behaviour is
    // covered end to end by Playwright, in e2e/.
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
