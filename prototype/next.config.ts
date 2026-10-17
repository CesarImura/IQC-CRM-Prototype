import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR lets a local `next build` check run next to the dev server without touching its .next folder.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The workspace root, so Turbopack can resolve the design system sources in ../design-system.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
}

export default nextConfig
