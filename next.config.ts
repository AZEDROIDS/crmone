import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  optimizeFonts: false,
  webpack: (config) => {
    // Modules optionnels de jsPDF non utilisés (PDF programmatique uniquement)
    config.resolve.alias.canvas      = false
    config.resolve.alias.html2canvas = false
    config.resolve.alias.dompurify   = false
    config.resolve.alias.canvg       = false
    return config
  },
}

export default nextConfig
