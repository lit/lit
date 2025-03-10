# @lit-labs/nextjs

Integrates Lit SSR with Next.js to enable deep server rendering of Lit components.

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/). It
> is published in order to get feedback on the design and may receive breaking
> changes or stop being supported.
>
> Please read our [Lit Labs documentation](https://lit.dev/docs/libraries/labs/)
> before using this library in production.

## Overview

Lit components can be imported and added to Next.js projects but by default they will only be _shallowly_ rendered on the server. That is, the Lit component's tag and attributes set via JSX will be rendered, but the component's shadow DOM will not be.

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

### Options

You can provide an options object as you create the plugin.

e.g.

```js
const withLitSSR = require('@lit-labs/nextjs')({
  addDeclarativeShadowDomPolyfill: true,
});
```

The following options are supported:

| Property                          | Type      | Description                                                                                                                                                                      |
| --------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addDeclarativeShadowDomPolyfill` | `boolean` | If `true`, the client bundle will include a script that applies the [Declarative Shadow DOM polyfill](https://github.com/webcomponents/template-shadowroot). Defaults to `true`. |

## Considerations

The plugin has been tested with Next.js versions 13 and 14.

If you are using Next.js App Router, you must make sure any Lit components you wish to use are beyond the `'use client';` boundary. These will still be server rendered for the initial page load just like they did for the Pages Router.

By default, components in the App Router are React Server Components (RSCs). Deep SSR of Lit components does **not** work within server components as they result in React hydration mismatch due to the presence of the `<template>` element in the RSC payload containing the serialized server component tree, and the custom element definitions will not be included with the client bundle either when imported in server component files.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
