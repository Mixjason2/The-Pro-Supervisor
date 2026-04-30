/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.58'],
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default nextConfig;