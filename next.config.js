const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === "production" ? "/SEA" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/SEA/" : "",
  trailingSlash: true,
};

module.exports = nextConfig;
