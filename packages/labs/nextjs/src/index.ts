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
    const usesDefaultWebpackModuleRulesExclude =
      pluginOptions.webpackModuleRulesExclude === undefined;
    const {
      addDeclarativeShadowDomPolyfill = true,
      webpackModuleRulesTest = /\/pages\/.*\.(?:j|t)sx?$|\/app\/.*\.(?:j|t)sx?$/,
      webpackModuleRulesExclude = [/next\/dist\//, /node_modules/],
    } = pluginOptions;

    const enableLitSsrImport =
      'side-effects @lit-labs/ssr-react/enable-lit-ssr.js';
    const dsdPolyfillImport =
      'side-effects @lit-labs/nextjs/lib/apply-dsd-polyfill.js';

    // Bare specifiers (no `side-effects ` prefix) for the custom Turbopack
    // loader, which takes a plain array of module specifiers.
    const enableLitSsrSpecifier = '@lit-labs/ssr-react/enable-lit-ssr.js';
    const dsdPolyfillSpecifier = '@lit-labs/nextjs/lib/apply-dsd-polyfill.js';

    // Resolved path to our custom loader. It is shipped as part of this
    // package (compiled by tsc into `./lib/`).
    const preserveDirectiveLoader = require.resolve(
      './lib/preserve-directive-imports-loader.js'
    );

    // Only emit the `turbopack` config when the user is actually running
    // Turbopack AND the installed Next.js supports the advanced
    // `{condition, loaders}` rule form (Next.js 16+).
    //
    // Detection:
    // - Next.js 16+ defaults to Turbopack for `next dev`/`next build`; the
    //   user can opt out with `--webpack`. (`process.env.TURBOPACK` is set
    //   for `--turbopack` but is *not* reliably set when Turbopack is the
    //   default, so we also key off the major version.)
    // - Next.js 15 and earlier default to webpack; `--turbopack` opts in,
    //   but its `turbopack.rules` schema only accepts simple
    //   `{loader, options}` rules — too limited for the per-file conditions
    //   this plugin needs (page/app dir scoping, RSC directive exclusion,
    //   client-only DSD polyfill). So on Next.js < 16 we omit the
    //   `turbopack` key entirely; the user's app will still run under
    //   webpack via the config below. Upgrade to Next.js 16+ for Turbopack
    //   support from this plugin.
    let nextMajorVersion = 0;
    try {
      // Resolve `next` from the user's project root (cwd) rather than from
      // this plugin's location. In a monorepo, the plugin and the consuming
      // app can have different `next` versions hoisted in their respective
      // `node_modules`, and we care about the version the app actually runs.
      const nextPkgPath = require.resolve('next/package.json', {
        paths: [process.cwd()],
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nextPkg = require(nextPkgPath) as {version?: string};
      nextMajorVersion = parseInt(nextPkg.version ?? '0', 10) || 0;
    } catch {
      // If we can't detect the version, fall back to webpack-only behavior.
    }
    const explicitWebpack = process.argv.includes('--webpack');
    const turbopackActive = nextMajorVersion >= 16 && !explicitWebpack;

    // Turbopack rules: use a small custom loader (shipped with this package)
    // to inject side-effectful imports into page and app directory files,
    // mirroring what the webpack config does below.
    //
    // The `browser` built-in condition is the Turbopack equivalent of webpack's
    // `!isServer` flag.
    //
    // In webpack, RSC directives ('use client'/'use server') are extracted in
    // a pre-pass before loaders run, so prepending imports with imports-loader
    // is safe. In Turbopack, loaders run *before* the directive is detected —
    // an import prepended ahead of `'use client'` causes that file to lose
    // its client-component status. Our custom loader preserves the directive
    // position by inserting the imports immediately *after* it.
    const turbopackExcludeConditions = usesDefaultWebpackModuleRulesExclude
      ? [{not: 'foreign'} as const]
      : webpackModuleRulesExclude.map(
          (exclude) => ({not: {path: exclude}}) as const
        );

    const turbopackPageCondition = {
      all: [
        ...turbopackExcludeConditions,
        // Match the same files as webpackModuleRulesTest.
        {path: webpackModuleRulesTest},
      ],
    };

    // Client components outside the page/app directories. Page/app files are
    // excluded here since they're already handled above.
    const turbopackClientComponentCondition = {
      all: [
        ...turbopackExcludeConditions,
        {not: {path: webpackModuleRulesTest}} as const,
      ],
    };

    const turbopackPageRules = [
      // Inject enable-lit-ssr.js into page/app files on both server and client.
      // On the server, the `node` export condition of @lit-labs/ssr-react
      // patches React for SSR. On the client, it installs hydration support.
      {
        condition: turbopackPageCondition,
        loaders: [
          {
            loader: preserveDirectiveLoader,
            options: {imports: [enableLitSsrSpecifier]},
          },
        ],
      },
      // Also inject into other client components. Turbopack doesn't guarantee
      // the import above runs before an unrelated client component defines a
      // Lit element, which would render SSR'd shadow roots twice.
      {
        condition: turbopackClientComponentCondition,
        loaders: [
          {
            loader: preserveDirectiveLoader,
            options: {imports: [enableLitSsrSpecifier], clientOnly: true},
          },
        ],
      },
      // Inject the DSD polyfill only on the client.
      ...(addDeclarativeShadowDomPolyfill
        ? [
            {
              condition: {
                all: [
                  'browser' as const,
                  ...turbopackExcludeConditions,
                  {path: webpackModuleRulesTest},
                ],
              },
              loaders: [
                {
                  loader: preserveDirectiveLoader,
                  options: {imports: [dsdPolyfillSpecifier]},
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
      ...(turbopackActive
        ? {
            turbopack: {
              ...existingTurbopack,
              rules: {
                ...existingRules,
                // Append our rules to any existing wildcard rules.
                '*': [...normalizedExistingWildcard, ...turbopackPageRules],
              },
            },
          }
        : {}),
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
