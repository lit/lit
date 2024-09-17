/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {existsSync, readFileSync} from 'node:fs';
import type {LoadHook, ResolveHook} from 'node:module';
import {fileURLToPath} from 'node:url';

import {type Options, transformSync} from '@swc/wasm';

/**
 * This implements an opinionated Node.js ESM hook to transpile TypeScript on the fly.
 * https://nodejs.org/api/module.html#customization-hooks
 *
 * This uses the @swc/wasm package for transpilation.
 * The official Node.js TypeScript integration uses a variant of this
 * without decorator support: https://github.com/nodejs/amaro
 */

const extensionMapping = Object.entries({
  '.mjs': '.mts',
  '.js': '.ts',
} as const);
const swcOptions: Options = {
  jsc: {
    externalHelpers: false,
    keepClassNames: true,
    parser: {
      decorators: true,
      dynamicImport: true,
      syntax: 'typescript',
    },
    target: 'es2021',
  },
  module: {
    type: 'nodenext',
  },
  sourceMaps: 'inline',
  swcrc: false,
};

/**
 * Checks for each import, whether the file exists and if not, tries
 * to find an associated TypeScript file.
 *
 * https://nodejs.org/api/module.html#resolvespecifier-context-nextresolve
 */
export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  if (!existsSync(new URL(specifier, context.parentURL))) {
    for (const [jsExtension, tsExtension] of extensionMapping) {
      if (specifier.endsWith(jsExtension)) {
        const maybeTsFile = new URL(
          specifier.substring(specifier.length - jsExtension.length) +
            tsExtension,
          context.parentURL
        );
        if (existsSync(maybeTsFile)) {
          return {format: 'module', shortCircuit: true, url: maybeTsFile.href};
        }
      }
    }
  }
  return nextResolve(specifier, context);
};

/**
 * When a module is imported, which was resolved to a TypeScript file
 * above, it is transpiled on the fly.
 *
 * https://nodejs.org/api/module.html#loadurl-context-nextload
 */
export const load: LoadHook = (url, context, nextLoad) => {
  if (
    !url.includes('/node_modules/') &&
    extensionMapping.some(([_, tsExtension]) => url.endsWith(tsExtension))
  ) {
    const filePath = fileURLToPath(url);
    const source = readFileSync(filePath, 'utf8');
    const result = transformSync(source, swcOptions);
    return {format: 'module', shortCircuit: true, source: result.code};
  }
  return nextLoad(url, context);
};
