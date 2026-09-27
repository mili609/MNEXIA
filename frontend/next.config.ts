import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this directory so Turbopack doesn't try to
  // infer it from an unrelated package-lock.json further up the filesystem.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
