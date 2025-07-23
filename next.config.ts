import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [],
  // Configure server to bind to 0.0.0.0 for Replit
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [];
    },
  }),
};

export default nextConfig;
