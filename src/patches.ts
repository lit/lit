/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { Locale } from './locales';

type Patches = Partial<
  {
    [key in Locale]: {
      [msgName: string]: Array<{ before: string; after: string }>;
    };
  }
>;
/**
 * Occasionally we need to apply small patches to the translations we receive.
 * Be sure to comment why they are here, and remove them when they are no longer
 * needed.
 */
const patches: Patches = {};

/**
 * Apply string-substitution patches to the given message.
 */
export const applyPatches = (locale: Locale, msgName: string, text: string) => {
  const subs = (patches[locale] || {})[msgName] || [];
  for (const { before, after } of subs) {
    while (text.includes(before)) {
      text = text.replace(before, after);
    }
  }
  return text;
};
