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
    'index',
    'lit-element',
    'experimental-hydrate-support',
    'private-ssr-support',
    'decorators',
    'decorators/custom-element',
    'decorators/event-options',
    'decorators/state',
    'decorators/property',
    'decorators/query',
    'decorators/query-all',
    'decorators/query-assigned-nodes',
    'decorators/query-async',
  ],
  external: ['lit-html', '@lit/reactive-element'],
  bundled: [
    {
      file: 'polyfill-support',
    },
  ],
});
