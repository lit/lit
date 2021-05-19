/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {render, RenderOptions} from '../../lit-html.js';

export interface ShadyRenderOptions extends RenderOptions {
  scope?: string;
}

const extraGlobals = window as LitExtraGlobals & typeof globalThis;

export const wrap =
  extraGlobals.ShadyDOM &&
  extraGlobals.ShadyDOM.inUse &&
  extraGlobals.ShadyDOM.noPatch === true
    ? extraGlobals.ShadyDOM!.wrap
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
