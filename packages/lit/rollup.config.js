/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
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
