/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../../rollup-common.js';

export default litProdConfig({
  classPropertyPrefix: 'δ',
  entryPoints: ['index', 'flip', 'position', 'flip-controller'],
  external: ['lit'],
});
