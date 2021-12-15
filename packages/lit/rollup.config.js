/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../rollup-common.js';
import {createRequire} from 'module';

export default litProdConfig({
  packageName: createRequire(import.meta.url)('./package.json').name,
  entryPoints: [
    'decorators',
    'decorators/custom-element',
    'decorators/event-options',
    'decorators/property',
    'decorators/query',
    'decorators/query-all',
    'decorators/query-assigned-nodes',
    'decorators/query-async',
    'decorators/state',
    'directive-helpers',
    'directive',
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
    'async-directive',
    'html',
    'experimental-hydrate-support',
    'experimental-hydrate',
    'index',
    'static-html',
  ],
  external: ['lit-element', 'lit-html', '@lit/reactive-element'],
  bundled: [
    {
      file: 'polyfill-support',
    },
    {
      file: 'index',
      output: 'lit.min',
      name: 'Lit',
    },
    {
      file: 'index',
      output: 'lit.bundle',
      format: 'es',
    },
  ],
});
