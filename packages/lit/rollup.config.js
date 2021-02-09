/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../rollup-common.js';

export default litProdConfig({
  classPropertyPrefix: 'ϖ',
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
    'directives/class-map',
    'directives/guard',
    'directives/if-defined',
    'directives/live',
    'directives/ref',
    'directives/render-light',
    'directives/repeat',
    'directives/style-map',
    'directives/template-content',
    'directives/unsafe-html',
    'directives/unsafe-svg',
    'directives/until',
    'async-directive',
    'html',
    'hydrate-support',
    'hydrate',
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
  ],
});
