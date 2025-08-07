import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    unoptimized: true, // For data URLs and blob URLs
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts'
  }
};

export default nextConfig;
