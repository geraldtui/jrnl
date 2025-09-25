/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'dist',
  // Only use basePath and assetPrefix in production builds
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/jrnl',
    assetPrefix: '/jrnl',
  }),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
