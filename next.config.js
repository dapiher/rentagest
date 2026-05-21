/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['docxtemplater', 'pizzip'],
  },
}

module.exports = nextConfig
