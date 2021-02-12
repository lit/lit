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
  classPropertyPrefix: 'Σ',
  entryPoints: [
    'directives/cache',
    'directives/class-map',
    'directives/guard',
    'directives/if-defined',
    'directives/live',
    'directives/ref',
    'directives/repeat',
    'directives/style-map',
    'directives/template-content',
    'directives/unsafe-html',
    'directives/unsafe-svg',
    'directives/until',
    'directives/render-light',
    'lit-html',
    'directive',
    'directive-helpers',
    'async-directive',
    'static',
    'hydrate',
    'private-ssr-support',
    'polyfill-support',
  ],
  bundled: [
    {
      file: 'polyfill-support',
    },
  ],
});
