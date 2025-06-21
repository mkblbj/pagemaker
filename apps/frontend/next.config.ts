import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pagemaker/shared-types"],
  experimental: {
    // Enable experimental features if needed
  },
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },
};

export default nextConfig;
