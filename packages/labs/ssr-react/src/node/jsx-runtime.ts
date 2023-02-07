/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview To serve as JSX import source for runtime JSX transforms in
 * production mode. For use in servers.
 */

// eslint-disable-next-line import/extensions
import * as ReactJSXRuntime from 'react/jsx-runtime';
import {createElement, type ReactNode, type ElementType} from 'react';
import {isCustomElement} from '../lib/utils.js';
import {renderCustomElement} from '../lib/node/render-custom-element.js';

export const Fragment = ReactJSXRuntime.Fragment;

export const jsx = <P extends {children?: ReactNode}>(
  type: ElementType<P>,
  props: P,
  key: string | undefined
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

      // Call `jsxs` instead of `jsx` so that React doesn't incorrectly
      // interpret that the children array was dynamically made and warn about
      // missing keys
      return ReactJSXRuntime.jsxs(type, {
        ...props,
        ...elementAttributes,
        children: [templateShadowRoot, props.children],
      });
    }
  }

  return ReactJSXRuntime.jsx(type, props, key);
};

export const jsxs = <P extends {children: ReactNode[]}>(
  type: ElementType<P>,
  props: P,
  key: string | undefined
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

      return ReactJSXRuntime.jsxs(
        type,
        {
          ...props,
          ...elementAttributes,
          children: [templateShadowRoot, ...props.children],
        },
        key
      );
    }
  }
  return ReactJSXRuntime.jsxs(type, props, key);
};
