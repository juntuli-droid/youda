/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@youda/game-assets'],
  experimental: {
    optimizePackageImports: ['@youda/game-assets'],
  },
};

export default nextConfig;
