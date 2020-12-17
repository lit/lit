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
  classPropertyPrefix: 'Φ',
  entryPoints: [
    'lit-element',
    'hydrate-support',
    'private-ssr-support',
    'decorators',
    'decorators/customElement',
    'decorators/eventOptions',
    'decorators/state',
    'decorators/property',
    'decorators/query',
    'decorators/queryAll',
    'decorators/queryAssignedNodes',
    'decorators/queryAsync',
    'demo/my-element',
  ],
  external: ['lit-html', '@lit/reactive-element'],
  bundled: [
    {
      file: 'platform-support',
    },
  ],
});
