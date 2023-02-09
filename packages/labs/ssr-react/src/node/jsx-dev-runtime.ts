/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview To serve as JSX import source for runtime JSX transforms in
 * development mode. For use in servers.
 */

// eslint-disable-next-line import/extensions
import * as ReactJSXDevRuntime from 'react/jsx-dev-runtime';
import {createElement, type ElementType, type ReactNode} from 'react';
import {isCustomElement} from '../lib/utils.js';
import {renderCustomElement} from '../lib/node/render-custom-element.js';

export const Fragment = ReactJSXDevRuntime.Fragment;

export const jsxDEV = <P extends {children?: ReactNode[] | ReactNode}>(
  type: ElementType<P>,
  props: P,
  key: string | undefined,
  isStaticChildren: boolean,
  source: Object,
  self: Object
) => {
  if (isCustomElement(type)) {
    const {shadowContents, elementAttributes, templateAttributes} =
      renderCustomElement(type, props);

    if (shadowContents) {
      const templateShadowRoot = createElement('template', {
        ...templateAttributes,
        dangerouslySetInnerHTML: {
          __html: [...shadowContents].join(''),
        },
      });

      return ReactJSXDevRuntime.jsxDEV(
        type,
        {
          ...props,
          ...elementAttributes,
          children: [
            templateShadowRoot,
            ...(isStaticChildren
              ? (props.children as ReactNode[])
              : [props.children]),
          ],
        },
        key,
        true, // hard-code to true so React won't warn about missing key
        source,
        self
      );
    }
  }

  return ReactJSXDevRuntime.jsxDEV(
    type,
    props,
    key,
    isStaticChildren,
    source,
    self
  );
};
