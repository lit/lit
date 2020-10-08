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

import {
  litRollupConfig
} from '../../rollup-common.js';

export default litRollupConfig({
  entryPoints: [
    'lit-element',
    'lib/platform-support',
    'lib/css-tag',
    'lib/decorators',
    'lib/decorators/base',
    'lib/decorators/customElement',
    'lib/decorators/eventOptions',
    'lib/decorators/internalProperty',
    'lib/decorators/property',
    'lib/decorators/query',
    'lib/decorators/queryAll',
    'lib/decorators/queryAssignedNodes',
    'lib/decorators/queryAsync',
  ],
  external: ['lit-html', 'updating-element']
});