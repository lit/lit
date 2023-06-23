/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This file builds lit-html tests (using the compiler).
 */

import * as url from 'url';
import * as path from 'path';
import {compile} from '../lib/compiler.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

compile(path.join(__dirname, '../../benchmarks/tsconfig.json'));
