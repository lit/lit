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

export type Locale = string & {__TYPE__: 'Locale'};

/**
 * Return whether the given string is formatted like a BCP 47 language tag. Note
 * we don't currently strictly validate against a known list of codes.
 */
export function isLocale(x: string): x is Locale {
  return x.match(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/) !== null;
}
