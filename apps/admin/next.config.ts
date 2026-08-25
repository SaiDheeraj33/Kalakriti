import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kalakriti/ui", "@kalakriti/types"],
  reactStrictMode: true,
};

export default nextConfig;
