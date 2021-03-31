/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../rollup-common.js';

export default litProdConfig({
  classPropertyPrefix: 'Π',
  entryPoints: [
    'reactive-element',
    'reactive-controller',
    'css-tag',
    'decorators',
    'decorators/base',
    'decorators/custom-element',
    'decorators/event-options',
    'decorators/state',
    'decorators/property',
    'decorators/query',
    'decorators/query-all',
    'decorators/query-assigned-nodes',
    'decorators/query-async',
  ],
  external: [],
  bundled: [
    {
      file: 'polyfill-support',
    },
  ],
});
