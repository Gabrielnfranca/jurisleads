import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() { return [ { source: '/captacao', destination: '/drcarlos' } ] },
};

export default nextConfig;
