import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all local IPs to prevent webpack-hmr errors
  serverExternalPackages: [],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*",
      },
      {
        source: "/ws/:path*",
        destination: "http://backend:8000/ws/:path*",
      },
    ];
  },
};

export default nextConfig;
