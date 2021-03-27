/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {TransformLitLocalizer} from './modes/transform.js';
import {readConfigFileAndWriteSchema} from './config.js';
import type {Config} from './types/config.js';
import type {TransformOutputConfig} from './types/modes.js';

export interface LocaleTransformer {
  locale: string;
  localeTransformer: {
    type: 'program';
    factory: (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;
  };
}

/**
 * Return an array of locales with associated TypeScript transformer factories
 * suitable for passing to the `transformers.before` [0] option of
 * `@rollup/plugin-typescript`.
 *
 * Example:
 *
 *   const locales = localeTransformers()
 *   export default locales.map(({locale, localeTransformer}) => ({
 *     input: `src/index.ts`,
 *     plugins: [
 *       typescript({
 *         transformers: {
 *           before: [localeTransformer],
 *         },
 *       }),
 *       resolve(),
 *     ],
 *     output: {
 *       file: `bundled/${locale}/index.js`,
 *       format: 'es',
 *     },
 *   }));
 *
 * [0] https://github.com/rollup/plugins/tree/master/packages/typescript/#transformers
 */
export const localeTransformers = (
  configPath = './lit-localize.json'
): Array<LocaleTransformer> => {
  const config = readConfigFileAndWriteSchema(configPath);
  if (config.output.mode !== 'transform') {
    throw Error('localeTransformers is only supported for transform mode');
  }
  const localizer = new TransformLitLocalizer(
    config as Config & {output: TransformOutputConfig}
  );
  const transformers = localizer.transformers();
  return [...transformers.entries()].map(([locale, factory]) => ({
    locale,
    localeTransformer: {type: 'program', factory},
  }));
};
