import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Pin the monorepo root so Next does not infer it from an unrelated
    // lockfile located in a parent directory.
    root: resolve(import.meta.dirname, '../..'),
  },
};

export default nextConfig;
