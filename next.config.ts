import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site, served by Caddy on the VPS from ./out
  output: "export",
  // every route exports as <route>/index.html, which any static server resolves
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
