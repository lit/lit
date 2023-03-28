/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {NextConfig} from 'next';

// TODO(augustjk) Consider adding option for adding template shadowroot polyfill
// automatically
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface LitSsrPluginOptions {}

export = (_pluginOptions: LitSsrPluginOptions = {}) =>
  (nextConfig: NextConfig = {}) => {
    return Object.assign({}, nextConfig, {
      webpack: (config, options) => {
        const {isServer, nextRuntime, webpack} = options;
        config.module.rules.unshift({
          // Grab entry points for all pages
          // TODO(augustjk) This may not work for the new "app" directory
          // https://github.com/lit/lit/issues/3657
          test: /\/pages\/.*\.(?:jsx?|tsx?)$/,
          // Exclude Next's own distributed files as they're commonjs and won't
          // play nice with `imports-loader`
          exclude: /next\/dist\//,
          loader: 'imports-loader',
          options: {
            // This adds a side-effectful import which monkey patches
            // `React.createElement` in the server and imports
            // `@lit-labs/ssr-client/lit-element-hydrate-support.js` in the client.
            imports: ['side-effects @lit-labs/ssr-react/enable-lit-ssr.js'],
          },
        });

        if (isServer && nextRuntime === 'nodejs') {
          // Next.js uses this externals setting to skip webpack bundling
          // external code for server environments but we specifically want to
          // catch react/jsx-runtime imports for external packages as well.
          // This might change in a future update to Next.js.
          // https://github.com/vercel/next.js/issues/46396
          // This is what we're grabbing:
          // https://github.com/vercel/next.js/blob/412dfc52cc5e378e4f74e44af698dad25031a938/packages/next/src/build/webpack-config.ts#L1378-L1429
          const nextHandleExternals = config.externals[0];
          config.externals = [
            (opt: {request: string}) => {
              if (
                opt.request === 'react/jsx-dev-runtime' ||
                opt.request === 'react/jsx-runtime'
              ) {
                // Returning empty promise makes these requests go through webpack
                return Promise.resolve();
              }
              return nextHandleExternals(opt);
            },
          ];
        }

        config.plugins.push(
          // Replace all module requests of the automatic JSX runtime sources to
          // `@lit-lab/ssr-react`'s except the ones within it.
          new webpack.NormalModuleReplacementPlugin(
            /react/,
            function (resource: {request: string; context: string}) {
              if (
                resource.request === 'react/jsx-runtime' &&
                // Don't replace our own imports.
                // Regex starts at "labs" instead of "lit-labs" to be able to
                // match the path of the package in the Lit monorepo.
                !/labs\/ssr-react/.test(resource.context)
              ) {
                resource.request = '@lit-labs/ssr-react/jsx-runtime';
              }
              if (
                resource.request === 'react/jsx-dev-runtime' &&
                // Don't replace our own imports.
                // Regex starts at "labs" instead of "lit-labs" to be able to
                // match the path of the package in the Lit monorepo.
                !/labs\/ssr-react/.test(resource.context)
              ) {
                resource.request = '@lit-labs/ssr-react/jsx-dev-runtime';
              }
            }
          )
        );

        // Apply user provided custom webpack config function if it exists.
        // There's potential for conflict here if existing `webpack` config also
        // overwrites externals.
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options);
        }

        return config;
      },
    } as Pick<NextConfig, 'webpack'>);
  };
