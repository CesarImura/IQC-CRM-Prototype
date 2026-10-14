import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The workspace root, so Turbopack can resolve the design system sources in ../design-system.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
}

export default nextConfig
