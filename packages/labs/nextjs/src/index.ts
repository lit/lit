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
  /**
   * Allows to pass a specific RegExp to match the files to be processed by the plugin.
   */
  webpackModuleRulesTest?: RegExp;
  /**
   * Allows to pass a specific RegExp to exclude files from being processed by the plugin.
   */
  webpackModuleRulesExclude?: Array<RegExp>;
}

export = (
    pluginOptions: LitSsrPluginOptions = {}
  ): ((nextConfig: NextConfig) => NextConfig) =>
  (nextConfig: NextConfig = {}) => {
    const {
      addDeclarativeShadowDomPolyfill = true,
      webpackModuleRulesTest = /\/pages\/.*\.(?:j|t)sx?$|\/app\/.*\.(?:j|t)sx?$/,
      webpackModuleRulesExclude = [/next\/dist\//, /node_modules/],
    } = pluginOptions;

    const enableLitSsrImport =
      'side-effects @lit-labs/ssr-react/enable-lit-ssr.js';
    const dsdPolyfillImport =
      'side-effects @lit-labs/nextjs/lib/apply-dsd-polyfill.js';

    // Turbopack rules: use imports-loader (which is compatible with Turbopack's
    // webpack loader implementation) to inject side-effectful imports into page
    // and app directory files, mirroring what the webpack config does below.
    //
    // The `browser` built-in condition is the Turbopack equivalent of webpack's
    // `!isServer` flag.
    // In webpack, RSC directives ('use client'/'use server') are extracted
    // before loaders run. In Turbopack, loaders run first and Turbopack then
    // checks for the directive — so an import prepended by imports-loader
    // before 'use client' causes a build error. Exclude those files; the
    // side-effect imports only need to run once per page load and will be
    // picked up from non-directive entry files (e.g. layout.tsx, _app.tsx).
    const noRscDirective = {
      not: {content: /['"]use (?:client|server)['"]/},
    } as const;

    const turbopackPageCondition = {
      all: [
        // Exclude Next.js internals and node_modules (equivalent to
        // webpackModuleRulesExclude defaults).
        {not: 'foreign'} as const,
        // Match the same files as webpackModuleRulesTest.
        {path: webpackModuleRulesTest},
        // Skip files with RSC directives — see noRscDirective above.
        noRscDirective,
      ],
    };

    const turbopackPageRules = [
      // Rule 1: Inject enable-lit-ssr.js on both server and client.
      // On the server, the `node` export condition of @lit-labs/ssr-react
      // patches React for SSR. On the client, it installs hydration support.
      {
        condition: turbopackPageCondition,
        loaders: [
          {
            loader: 'imports-loader',
            options: {imports: [enableLitSsrImport]},
          },
        ],
      },
      // Rule 2: Inject the DSD polyfill only on the client.
      ...(addDeclarativeShadowDomPolyfill
        ? [
            {
              condition: {
                all: [
                  'browser' as const,
                  {not: 'foreign'} as const,
                  {path: webpackModuleRulesTest},
                  noRscDirective,
                ],
              },
              loaders: [
                {
                  loader: 'imports-loader',
                  options: {imports: [dsdPolyfillImport]},
                },
              ],
            },
          ]
        : []),
    ];

    // Merge our Turbopack rules with any existing ones from the user's config.
    const existingTurbopack = nextConfig.turbopack ?? {};
    const existingRules = existingTurbopack.rules ?? {};
    const existingWildcard = existingRules['*'];
    const normalizedExistingWildcard = existingWildcard
      ? Array.isArray(existingWildcard)
        ? existingWildcard
        : [existingWildcard]
      : [];

    return Object.assign({}, nextConfig, {
      turbopack: {
        ...existingTurbopack,
        rules: {
          ...existingRules,
          // Append our rules to any existing wildcard rules.
          '*': [...normalizedExistingWildcard, ...turbopackPageRules],
        },
      },
      webpack: (config, options) => {
        const {isServer} = options;

        // This adds a side-effectful import which monkey patches
        // `React.createElement` and Runtime JSX functions in the server and
        // imports `@lit-labs/ssr-client/lit-element-hydrate-support.js` in the
        // client.
        const imports = [enableLitSsrImport];

        if (!isServer && addDeclarativeShadowDomPolyfill) {
          // Add script that applies @webcomponents/template-shadowroot ponyfill
          // on document.body
          imports.push(dsdPolyfillImport);
        }

        config.module.rules.unshift({
          // Grab entry points for all pages.
          // TODO(augustjk) It would nicer to inject only once in either
          // `pages/_document.tsx`, `pages/_app.tsx`, or `app/layout.tsx` but
          // they're not guaranteed to exist.
          test: webpackModuleRulesTest,
          // Exclude Next's own distributed files as they're commonjs and won't
          // play nice with `imports-loader`.
          exclude: webpackModuleRulesExclude,
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
    } as Pick<NextConfig, 'webpack' | 'turbopack'>);
  };
