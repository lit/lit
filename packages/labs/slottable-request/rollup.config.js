/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../../rollup-common.js';
import {createRequire} from 'module';

export default litProdConfig({
  packageName: createRequire(import.meta.url)('./package.json').name,
  entryPoints: [
    'slottable-request-event',
    'render-slottable',
    'request-slottable',
  ],
});
