/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {e2eGoldensTest} from './e2e-goldens-test';

e2eGoldensTest('extract-xlb', ['--config=lit-localize.json', 'extract']);
