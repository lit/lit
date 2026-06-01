/// <reference lib="dom" />

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';

if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
  hydrateShadowRoots(document.body);
}
