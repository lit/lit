/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '../element-a.js';

// This must infer as ElementA i norder to trigger
// https://github.com/lit/lit/issues/4743
const element = document.querySelector('element-a');
console.log(element);
