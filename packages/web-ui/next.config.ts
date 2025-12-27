import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Transpile the shared package for Prisma types
  transpilePackages: ['@mission-control/shared'],
}

export default nextConfig
