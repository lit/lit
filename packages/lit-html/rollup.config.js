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

import {litRollupConfig} from '../../rollup-common.js';

export default litRollupConfig({
  entryPoints: [
    'directives/cache',
    'directives/class-map',
    'directives/guard',
    'directives/if-defined',
    'directives/live',
    'directives/repeat',
    'directives/style-map',
    'directives/template-content',
    'directives/unsafe-html',
    'directives/unsafe-svg',
    'lit-html',
    'parts',
  ],
  reservedProperties: [
    '_$litType$',
    '_$litDirective$',
    // TODO Decide on public API
    // https://github.com/Polymer/lit-html/issues/1261
    '_value',
    '_setValue',
  ],
});
