/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {render, RenderOptions} from 'lit-html';

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
