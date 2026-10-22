const withLitSSR = require('@lit-labs/nextjs')({
  addDeclarativeShadowDomPolyfill: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withLitSSR(nextConfig);
