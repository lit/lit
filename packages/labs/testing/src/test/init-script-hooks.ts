/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {existsSync, readFileSync} from 'node:fs';
import type {LoadHook, ResolveHook} from 'node:module';
import {fileURLToPath} from 'node:url';

import * as ts from 'typescript';

/**
 * Note: This is not a performant hook implementation,
 * but serves its purpose for testing.
 */

const root = new URL('../', import.meta.url).href;
const tsconfigPath = new URL('./tsconfig.json', root).href;
const tsconfig = ts.getParsedCommandLineOfConfigFile(
  fileURLToPath(tsconfigPath),
  {},
  ts.sys as unknown as ts.ParseConfigFileHost
);

const exists = (url: string) => existsSync(fileURLToPath(url));
const assertTypeScriptFilePath = (
  url: string,
  tsUrl = url.replace(/.js$/, '.ts')
) => (tsUrl && url && !exists(url) && exists(tsUrl) ? tsUrl : null);

export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  const url =
    (specifier.startsWith('.') || specifier.startsWith(root)) &&
    !specifier.includes('/node_modules/') &&
    context.parentURL?.startsWith(root)
      ? assertTypeScriptFilePath(new URL(specifier, context.parentURL).href)
      : null;
  return url
    ? {format: 'module', shortCircuit: true, url}
    : nextResolve(specifier, context);
};

export const load: LoadHook = (url, context, nextLoad) => {
  if (
    url.startsWith(root) &&
    !url.includes('/node_modules/') &&
    url.endsWith('.ts')
  ) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    const result = ts.transpileModule(source, {
      compilerOptions: tsconfig?.options,
    });
    return {format: 'module', shortCircuit: true, source: result.outputText};
  }
  return nextLoad(url, context);
};
