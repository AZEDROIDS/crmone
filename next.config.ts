import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  // Ignore TypeScript and ESLint errors during build (fix later)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
