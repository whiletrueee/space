import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site, served as Cloudflare static assets from ./out
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
