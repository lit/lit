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
  PropsWithChildren,
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
  return function litPatchedCreateElement<P>(
    type: ElementType<P>,
    props: PropsWithChildren<P> | null,
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
        // React.createElement prefers children arguments over props.children
        // https://github.com/facebook/react/blob/v18.2.0/packages/react/src/ReactElement.js#L401-L417
        if (children.length > 0) {
          newChildren.push(...children);
        } else if (Array.isArray(props?.children)) {
          newChildren.push(...props!.children);
        } else if (props?.children !== undefined) {
          newChildren.push(props.children);
        }

        return originalCreateElement(
          type,
          {...props, ...elementAttributes},
          ...newChildren
        );
      }
    }
    // The types here are complex, but the important thing is just that we're
    // passing through the arguments to the original createElement function.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return originalCreateElement(type as any, props, ...children);
  };
}
