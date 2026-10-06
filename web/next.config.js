const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@blockverse/shared"],
  outputFileTracingRoot: path.join(__dirname, ".."),
};

module.exports = nextConfig;
