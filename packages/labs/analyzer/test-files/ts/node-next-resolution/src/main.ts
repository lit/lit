/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '../element-a.js';

// This must infer as ElementA in order to trigger
// https://github.com/lit/lit/issues/4743
const element = document.querySelector('element-a');
console.log(element);
