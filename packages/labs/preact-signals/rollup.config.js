/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../../rollup-common.js';
import {createRequire} from 'module';

export const defaultConfig = (options = {}) =>
  litProdConfig({
    packageName: createRequire(import.meta.url)('./package.json').name,
    entryPoints: ['index', 'lib/signal-watcher', 'lib/watch'],
    ...options,
  });

export default defaultConfig();
