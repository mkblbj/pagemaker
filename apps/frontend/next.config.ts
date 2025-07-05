import type { NextConfig } from "next";
import path from "path";

// 加载根目录的 .env 文件
const envPath = path.resolve(__dirname, "../../.env");
require("dotenv").config({ path: envPath });

const nextConfig: NextConfig = {
  transpilePackages: ["@pagemaker/shared-types"],
  experimental: {
    // Enable experimental features if needed
  },
  // App Router 是默认启用的，不需要显式配置
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },
  // 确保环境变量在构建时可用
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // 降低构建时的检查标准
  eslint: {
    // 在构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
