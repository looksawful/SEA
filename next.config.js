const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/Awful-Exercises' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Awful-Exercises/' : '',
  trailingSlash: true,
}

module.exports = nextConfig
