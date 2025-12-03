/**
 * @license
 * Copyright The Lit Project
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const isCustomElement = (type: string | Object): type is string =>
  typeof type === 'string' && !!customElements.get(type);
