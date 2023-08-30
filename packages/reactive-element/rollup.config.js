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
    'reactive-element',
    'reactive-controller',
    'css-tag',
    'decorators',
    'decorators/custom-element',
    'decorators/event-options',
    'decorators/state',
    'decorators/property',
    'decorators/query',
    'decorators/query-all',
    'decorators/query-assigned-elements',
    'decorators/query-assigned-nodes',
    'decorators/query-async',
  ],
  external: [],
  bundled: [
    {
      file: 'polyfill-support',
    },
  ],
  includeNodeBuild: true,
});
