import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Contract: local-only API rewrite. Preview/prod must use NEXT_PUBLIC_API_URL.
  async rewrites() {
    // When NEXT_PUBLIC_API_URL is absent, default to local backend for development.
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
