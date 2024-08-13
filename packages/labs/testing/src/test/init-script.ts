/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {register} from 'node:module';

register(new URL('./init-script-hooks.js', import.meta.url));
