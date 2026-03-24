import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all local IPs to prevent webpack-hmr errors
  serverExternalPackages: [],
  // experimental config or just allowedDevOrigins
};

export default nextConfig;
