/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElementRenderer} from '@lit-labs/ssr/lib/lit-element-renderer.js';
import {getElementRenderer} from '@lit-labs/ssr/lib/element-renderer.js';
import type {RenderInfo} from '@lit-labs/ssr/lib/render-lit-html.js';

/**
 * Renders the shadow contents of the provided custom element type with props.
 * Should only be called in server environments.
 */
export const renderShadowContents = (type: string, props: {} | null) => {
  const renderInfo: RenderInfo = {
    elementRenderers: [LitElementRenderer],
    customElementInstanceStack: [],
    customElementHostStack: [],
    deferHydration: false,
  };

  const renderer = getElementRenderer(renderInfo, type);

  if (props != null) {
    for (const [k, v] of Object.entries(props)) {
      if (renderer.element) {
        if (k in renderer.element) {
          renderer.setProperty(k, v);
        } else {
          renderer.setAttribute(k, String(v));
        }
      }
    }
  }

  renderer.connectedCallback();

  renderInfo.customElementInstanceStack.push(renderer);

  const shadowContents = renderer.renderShadow(renderInfo);

  const elementAttributes = renderer.element?.attributes;

  const {mode = 'open', delegatesFocus} = renderer.shadowRootOptions;
  const templateAttributes = {
    shadowroot: mode,
    ...(delegatesFocus ? {shadowrootdelegatesfocus: ''} : {}),
  };

  return {
    shadowContents,
    elementAttributes,
    templateAttributes,
  };
};
