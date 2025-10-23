/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb'
    }
  },
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
