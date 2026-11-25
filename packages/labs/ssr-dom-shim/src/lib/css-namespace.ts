/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a limited implementation of the `CSS` namespace, with only
 * `CSS.escape()`.
 */

const hexEscape = (char: string) => `\\${char.charCodeAt(0).toString(16)} `;

/**
 * The CSSOM "serialize an identifier" algorithm.
 * https://drafts.csswg.org/cssom/#the-css.escape()-method
 */
const escape = (ident: string): string => {
  ident = String(ident);
  return ident === '-'
    ? '\\-'
    : ident.replace(
        // eslint-disable-next-line no-control-regex
        /^(-?)(\d)|[\0-\x1f\x7f]|[^\w\u0080-￿-]/g,
        (char, dash?: string, digit?: string) =>
          digit !== undefined
            ? dash + hexEscape(digit)
            : char === '\0'
              ? '�'
              : char < ' ' || char === '\x7f'
                ? hexEscape(char)
                : '\\' + char
      );
};

const CSSShim = {escape};

const CSSShimWithRealType = CSSShim as object as typeof CSS;
export {CSSShimWithRealType as CSS, CSSShimWithRealType as CSSShim};
