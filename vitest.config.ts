import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // The same alias tsconfig gives the editor and Next gives the build, so a
    // module resolves identically whether it is being typed, bundled or tested.
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    // The calculation layer and the shared layer. Browser behaviour is covered
    // end to end by Playwright, in e2e/.
    include: ['lib/**/*.test.ts', 'shared/**/*.test.ts'],
    environment: 'node',
  },
});
