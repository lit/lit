/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../../rollup-common.js';

export default litProdConfig({
  classPropertyPrefix: 'Λ',
  entryPoints: [
    'index',
    'directives/render-light',
    'directives/server-until',
    'controllers/server-controller',
  ],
  external: ['lit/directive.js', 'lit/directive-helpers.js'],
});
