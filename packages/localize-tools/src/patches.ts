/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {Locale} from './types/locale.js';

export type Patches = {
  [locale: string]: {
    [msgName: string]: Array<{before: string; after: string}>;
  };
};

/**
 * Apply string-substitution patches to the given message.
 */
export const applyPatches = (
  patches: Patches,
  locale: Locale,
  msgName: string,
  text: string
) => {
  const subs = (patches[locale] || {})[msgName] || [];
  for (const {before, after} of subs) {
    while (text.includes(before)) {
      text = text.replace(before, after);
    }
  }
  return text;
};
