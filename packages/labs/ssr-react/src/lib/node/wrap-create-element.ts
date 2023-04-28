/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {isCustomElement} from '../utils.js';
import {renderCustomElement} from './render-custom-element.js';

import type {
  createElement as ReactCreateElement,
  ElementType,
  ReactElement,
  ReactNode,
} from 'react';

/**
 * Wraps the provided `createElement` function to also server render Lit
 * component's shadow DOM.
 */
export function wrapCreateElement(
  // TODO(augustjk) Should the type for this param be more generic to allow
  // non-React alternatives like preact?
  originalCreateElement: typeof ReactCreateElement
) {
  return function createElement<
    P extends {children?: ReactNode | Array<ReactNode>}
  >(
    type: ElementType<P>,
    props: P | null,
    ...children: ReactNode[]
  ): ReactElement {
    if (isCustomElement(type)) {
      const {shadowContents, elementAttributes, templateAttributes} =
        renderCustomElement(type, props);

      if (shadowContents !== undefined) {
        const templateShadowRoot = originalCreateElement('template', {
          ...templateAttributes,
          dangerouslySetInnerHTML: {
            __html: [...shadowContents].join(''),
          },
        });

        const newChildren: ReactNode[] = [templateShadowRoot];
        if (props?.children !== undefined) {
          if (Array.isArray(props.children)) {
            newChildren.push(...props.children);
          } else {
            newChildren.push(props.children);
          }
        }
        newChildren.push(...children);

        return originalCreateElement(
          type,
          {...props, ...elementAttributes},
          ...newChildren
        );
      }
    }
    return originalCreateElement(type, props, ...children);
  };
}
