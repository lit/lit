/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../../rollup-common.js';
import {createRequire} from 'module';

export default litProdConfig({
  packageName: createRequire(import.meta.url)('./package.json').name,
  entryPoints: [
    'index',
    'lit-element-hydrate-support',
    'directives/render-light',
  ],
  external: ['lit/directive.js', 'lit/directive-helpers.js'],
  includeNodeBuild: true,
});
