/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {isCustomElement} from './utils.js';
import {renderShadowContents} from './render-shadow-contents.js';

import type {
  createElement as ReactCreateElement,
  ElementType,
  ReactElement,
  ReactNode,
} from 'react';

/**
 * Patches the provided `createElement` function to also server render Lit
 * component's shadow DOM.
 */
export function patchCreateElement(
  // TODO(augustjk) Should the type for this param be more generic to allow
  // non-React alternatives like preact?
  originalCreateElement: typeof ReactCreateElement
) {
  return function createElement<P extends {}>(
    type: ElementType<P>,
    props: P,
    ...children: ReactNode[]
  ): ReactElement {
    if (isCustomElement(type)) {
      const {shadowContents, elementAttributes, templateAttributes} =
        renderShadowContents(type, props);

      if (shadowContents !== undefined) {
        const templateShadowRoot = originalCreateElement('template', {
          ...templateAttributes,
          dangerouslySetInnerHTML: {
            __html: [...shadowContents].join(''),
          },
        });

        return originalCreateElement(
          type,
          {...props, ...elementAttributes},
          templateShadowRoot,
          ...children
        );
      }
    }
    return originalCreateElement(type, props, ...children);
  };
}
