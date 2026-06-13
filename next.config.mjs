import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: { root: __dirname },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*` },
    ];
  },
};
export default nextConfig;
