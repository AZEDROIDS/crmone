import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  optimizeFonts: false,   // ← désactive le téléchargement de fonts au build
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
