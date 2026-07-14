import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",           // requis pour Docker/Fly.io
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  images: {
    remotePatterns: [],
  },
  // Pour le rendu PDF côté serveur (jspdf)
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
