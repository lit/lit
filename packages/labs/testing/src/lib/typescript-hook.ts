/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {existsSync, readFileSync} from 'node:fs';
import type {InitializeHook, LoadHook, ResolveHook} from 'node:module';
import {basename, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  type JscConfig,
  type JscTarget,
  type Options,
  transformSync,
} from '@swc/wasm';
import * as ts from 'typescript';

import type {TypeScriptOptions} from './lit-ssr-plugin';

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
const defaultTarget: JscTarget = 'es2021';
let swcOptions: Partial<JscConfig> | undefined = undefined;

const parseTransformOptionsFromTsconfig = (
  tsconfig: string
): Partial<JscConfig> => {
  const {config, error} = ts.readConfigFile(tsconfig, ts.sys.readFile);
  if (error) {
    throw error;
  }

  const {options} = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    dirname(tsconfig),
    undefined,
    basename(tsconfig)
  );

  return {
    target: options.target
      ? (ts.ScriptTarget[options.target].toLowerCase() as JscTarget)
      : defaultTarget,
    transform: {
      legacyDecorator: options.experimentalDecorators,
      decoratorMetadata: options.emitDecoratorMetadata,
      useDefineForClassFields: options.useDefineForClassFields,
      // decoratorVersion is not part of the API types, but works correctly
      ...(options.experimentalDecorators
        ? {}
        : {
            decoratorVersion: '2022-03',
          }),
    },
  };
};

const findAndParseTransformOptionsFromTsconfig = (
  filePath: string
): Partial<JscConfig> => {
  const tsconfig = ts.findConfigFile(filePath, ts.sys.fileExists);
  if (!tsconfig) {
    throw new Error(
      `No tsconfig.json found for ${filePath}! ` +
        'Configure the tsconfig option in the litSsrPlugin typeScript options, ' +
        'if you have a differently named tsconfig.json file.'
    );
  }

  return parseTransformOptionsFromTsconfig(tsconfig);
};

/**
 * Initializes the hook module.
 *
 * https://nodejs.org/api/module.html#initialize
 */
export const initialize: InitializeHook<TypeScriptOptions | undefined> = (
  data
): void => {
  swcOptions = data?.tsconfig
    ? parseTransformOptionsFromTsconfig(data.tsconfig)
    : undefined;
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
          specifier.substring(0, specifier.length - jsExtension.length) +
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

    const options: Options = {
      jsc: {
        externalHelpers: false,
        keepClassNames: true,
        parser: {
          decorators: true,
          dynamicImport: true,
          syntax: 'typescript',
        },
        ...(swcOptions ??
          findAndParseTransformOptionsFromTsconfig(dirname(filePath))),
      },
      module: {
        type: 'nodenext',
      },
      sourceMaps: 'inline',
      swcrc: false,
    };
    const result = transformSync(source, options);
    return {format: 'module', shortCircuit: true, source: result.code};
  }
  return nextLoad(url, context);
};
