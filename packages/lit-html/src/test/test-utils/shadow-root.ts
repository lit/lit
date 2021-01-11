/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

import {render, RenderOptions} from '../../lit-html.js';

export interface ShadyRenderOptions extends RenderOptions {
  scope?: string;
}

export const wrap =
  window.ShadyDOM && window.ShadyDOM.inUse && window.ShadyDOM.noPatch === true
    ? window.ShadyDOM!.wrap
    : (node: Node) => node;

export const shadowRoot = (element: Node) =>
  (wrap(element) as Element).shadowRoot;

/**
 * A helper for creating a shadowRoot on an element.
 */
export const renderShadowRoot = (result: unknown, element: Element) => {
  if (!(wrap(element) as Element).shadowRoot) {
    (wrap(element) as Element).attachShadow({mode: 'open'});
  }
  render(result, (wrap(element) as Element).shadowRoot!, {
    scope: element.localName,
  } as ShadyRenderOptions);
};
