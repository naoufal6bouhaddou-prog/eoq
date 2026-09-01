import type { NextConfig } from 'next';

/**
 * Static export: every calculation runs in the browser, so there is nothing to
 * serve beyond files. `next build` writes a complete site to out/, which is
 * what Vercel deploys and what the Playwright suite runs against.
 */
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
};

export default nextConfig;
