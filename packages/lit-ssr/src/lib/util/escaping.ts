/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-end.html#escapingString
const escapeAttrRegExp = /[&\u00A0"]/g;
const escapeDataRegExp = /[&\u00A0<>]/g;

const escapeReplace = (c: string) => {
  switch (c) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '"':
      return '&quot;';
    case '\u00A0':
      return '&nbsp;';
  }
  throw new Error('unexpected');
}

export const escapeAttribute = (s: string) => {
  return s.replace(escapeAttrRegExp, escapeReplace);
}

export const escapeTextContent = (s: string) => {
  return s.replace(escapeDataRegExp, escapeReplace);
}
