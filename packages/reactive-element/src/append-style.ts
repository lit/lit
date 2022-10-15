/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  CSSResult,
  CSSResultOrNative,
  supportsAdoptingStyleSheets,
} from './css-tag.js';

const NODE_MODE = false;
const global = NODE_MODE ? globalThis : window;

/**
 * Appends the given styles to a `shadowRoot` or `document`.
 *
 * Note, when shimming is used, any styles that are subsequently placed into
 * the shadowRoot should be placed *before* any shimmed adopted styles. This
 * will match spec behavior that gives adopted sheets precedence over styles in
 * shadowRoot.
 *
 * Note that this does not do any deduping.
 */
export const appendStyles = (
  renderRoot: Document | ShadowRoot,
  styles: Array<CSSResultOrNative>
) => {
  if (supportsAdoptingStyleSheets) {
    for (const style of styles) {
      const sheet = style instanceof CSSStyleSheet ? style : style.styleSheet!;
      renderRoot.adoptedStyleSheets.push(sheet);
    }
  } else {
    // we assume that the styles aren't native because you can't support
    // adoptedStyleSheets without also supporting CSSStyleSheet
    for (const style of styles as CSSResult[]) {
      const styleElem = document.createElement('style');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nonce = (global as any)['litNonce'];
      if (nonce !== undefined) {
        styleElem.setAttribute('nonce', nonce);
      }
      styleElem.textContent = style.cssText;
      (
        (renderRoot as Partial<Document>).documentElement || renderRoot
      ).appendChild(styleElem);
    }
  }
};
