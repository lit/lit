/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../../rollup-common.js';

export default litProdConfig({
  classPropertyPrefix: '⍶',
  entryPoints: ['index', 'task'],
  external: ['@lit/reactive-element'],
});
