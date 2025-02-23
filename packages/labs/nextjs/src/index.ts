/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {NextConfig} from 'next';

/**
 * Options for the Lit SSR plugin
 */
interface LitSsrPluginOptions {
  /**
   * Whether to include the polyfill for Declarative Shadow DOM. Defaults to true.
   */
  addDeclarativeShadowDomPolyfill?: boolean;
}

export = (
    pluginOptions: LitSsrPluginOptions = {}
  ): ((nextConfig: NextConfig) => NextConfig) =>
  (nextConfig: NextConfig = {}) => {
    return Object.assign({}, nextConfig, {
      webpack: (config, options) => {
        const {isServer} = options;

        const {addDeclarativeShadowDomPolyfill = true} = pluginOptions;

        // This adds a side-effectful import which monkey patches
        // `React.createElement` and Runtime JSX functions in the server and
        // imports `@lit-labs/ssr-client/lit-element-hydrate-support.js` in the
        // client.
        const imports = ['side-effects @lit-labs/ssr-react/enable-lit-ssr.js'];

        if (!isServer && addDeclarativeShadowDomPolyfill) {
          // Add script that applies @webcomponents/template-shadowroot ponyfill
          // on document.body
          imports.push(
            'side-effects @lit-labs/nextjs/lib/apply-dsd-polyfill.js'
          );
        }

        config.module.rules.unshift({
          // Grab entry points for all pages.
          // TODO(augustjk) It would nicer to inject only once in either
          // `pages/_document.tsx`, `pages/_app.tsx`, or `app/layout.tsx` but
          // they're not guaranteed to exist.
          test: /\/pages\/.*\.(?:j|t)sx?$|\/app\/.*\.(?:j|t)sx?$/,
          // Exclude Next's own distributed files as they're commonjs and won't
          // play nice with `imports-loader`.
          exclude: /next\/dist\//,
          loader: 'imports-loader',
          options: {
            imports,
          },
        });

        // Apply user provided custom webpack config function if it exists.
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options);
        }

        return config;
      },
    } as Pick<NextConfig, 'webpack'>);
  };
