import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Transpile the shared package for Prisma types
  transpilePackages: ['@mcp-tracker/shared'],
}

export default nextConfig
