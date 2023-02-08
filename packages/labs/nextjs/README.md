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

The plugin has been tested with Next.js versions 12 and 13. It currently does not support usage with the beta `app` directory introduced with version 13. Follow this [issue](https://github.com/lit/lit/issues/3657) for updates on supporting this feature.

The plugin may not work properly if you are providing a custom webpack configuration that modifies `config.externals`. Please file an issue if you find a particular configuration is not working.

The server rendered output contains HTML with declarative shadow DOM which may require a polyfill for some browsers. See [Enabling Declarative Shadow DOM from `@lit-labs/ssr-react`](../ssr-react/README.md#enabling-declarative-shadow-dom) for more information.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).