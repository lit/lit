# @lit-labs/ssr-react

A package for integrating Lit SSR with Next.js.

## Overview

Lit components, by default, can be imported and added to Next.js projects but will only be shallowly rendered on the server.

This package provides a plugin for Next.js that incorporates tools from [`@lit-labs/ssr-react`](../ssr-react/README.md) into the project for deep server rendering of Lit components.

## Usage

```js
// next.config.js
const withLitSSR = require('@lit-labs/nextjs')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add your own config here
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withLitSSR(nextConfig);
```

## Considerations

The plugin has been tested with Next.js versions 12 and 13. It currently does not support usage with the experimental `app` directory introduced with version 13.

The plugin may not work properly if you are providing a custom webpack configuration that modifies `config.externals`. Please file an issue if you find a particular configuration is not working.

The server rendered output contains HTML with declarative shadow DOM which has limited browser support. See [`@lit-labs/ssr-react`](../ssr-react/README.md#other-considerations) for more information.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
