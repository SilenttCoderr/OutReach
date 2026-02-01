import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Remove hardcoded localhost rewrite for production
  // In production, use NEXT_PUBLIC_API_URL environment variable instead
  async rewrites() {
    // Only add rewrite for development when API_URL is not set
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
