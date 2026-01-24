const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/painful' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/painful/' : '',
  trailingSlash: true,
}

module.exports = nextConfig
