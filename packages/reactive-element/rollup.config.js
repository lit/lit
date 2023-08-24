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
    'decorators/base',
    'decorators/custom-element',
    'decorators/event-options',
    'decorators/state',
    'decorators/property',
    'decorators/query',
    'decorators/query-all',
    'decorators/query-assigned-elements',
    'decorators/query-assigned-nodes',
    'decorators/query-async',
    'std-decorators',
    'std-decorators/custom-element',
    'std-decorators/event-options',
    'std-decorators/state',
    'std-decorators/property',
    'std-decorators/query',
    'std-decorators/query-all',
    'std-decorators/query-assigned-elements',
    'std-decorators/query-assigned-nodes',
    'legacy-decorators',
    'legacy-decorators/base',
    'legacy-decorators/custom-element',
    'legacy-decorators/event-options',
    'legacy-decorators/state',
    'legacy-decorators/property',
    'legacy-decorators/query',
    'legacy-decorators/query-all',
    'legacy-decorators/query-assigned-elements',
    'legacy-decorators/query-assigned-nodes',
    'legacy-decorators/query-async',
  ],
  external: [],
  bundled: [
    {
      file: 'polyfill-support',
    },
  ],
  includeNodeBuild: true,
});
