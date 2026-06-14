import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    // @supabase/realtime-js >= 2.10 importa @supabase/phoenix (realtime presence)
    // que não é necessário para este app.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/phoenix': false,
    }
    return config
  },
}

export default nextConfig
