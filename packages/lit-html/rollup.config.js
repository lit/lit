/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../rollup-common.js';
import {createRequire} from 'module';

export const defaultConfig = (options = {}) =>
  litProdConfig({
    packageName: createRequire(import.meta.url)('./package.json').name,
    entryPoints: [
      'directives/async-append',
      'directives/async-replace',
      'directives/cache',
      'directives/choose',
      'directives/class-map',
      'directives/guard',
      'directives/if-defined',
      'directives/join',
      'directives/keyed',
      'directives/live',
      'directives/map',
      'directives/range',
      'directives/ref',
      'directives/repeat',
      'directives/style-map',
      'directives/template-content',
      'directives/unsafe-html',
      'directives/unsafe-svg',
      'directives/until',
      'directives/when',
      'lit-html',
      'directive',
      'directive-helpers',
      'async-directive',
      'static',
      'private-ssr-support',
      'polyfill-support',
      'is-server',
    ],
    bundled: [
      {
        file: 'polyfill-support',
      },
    ],
    includeNodeBuild: true,
    ...options,
  });

export default defaultConfig();
