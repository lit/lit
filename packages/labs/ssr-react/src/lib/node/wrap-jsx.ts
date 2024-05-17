/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {jsx, jsxs} from 'react/jsx-runtime';
import type {jsxDEV} from 'react/jsx-dev-runtime';
import {createElement, type ReactNode, type ElementType} from 'react';
import {renderCustomElement} from './render-custom-element.js';
import {isCustomElement} from '../utils.js';
import {collectResultSync} from '@lit-labs/ssr/lib/render-result.js';

/**
 * Produces a wrapped jsx-runtime `jsx` function that will server render Lit
 * components' shadow DOM.
 *
 * @param originalJsx The original `jsx` function to wrap.
 * @param originalJsxs The original `jsxs` function to be used for creating
 * React elements with static children.
 * @returns Wrapped `jsx` function to be used for production builds.
 */
export function wrapJsx(originalJsx: typeof jsx, originalJsxs: typeof jsxs) {
  return function litPatchedJsx<P extends {children?: ReactNode}>(
    type: ElementType<P>,
    props: P,
    key: string | undefined
  ) {
    if (isCustomElement(type)) {
      const {shadowContents, elementAttributes, templateAttributes} =
        renderCustomElement(type, props);

      if (shadowContents) {
        const templateShadowRoot = createElement('template', {
          ...templateAttributes,
          dangerouslySetInnerHTML: {
            __html: collectResultSync(shadowContents),
          },
        });

        // Call `jsxs` instead of `jsx` so that React doesn't incorrectly
        // interpret that the children array was dynamically made and warn about
        // missing keys
        return originalJsxs(type, {
          ...props,
          ...elementAttributes,
          children: [templateShadowRoot, props.children],
        });
      }
    }

    return originalJsx(type, props, key);
  };
}

/**
 * Produces a wrapped jsx-runtime `jsxs` function that will server render Lit
 * components' shadow DOM.
 *
 * @param originalJsxs The original `jsxs` function to wrap.
 * @returns Wrapped `jsxs` function to be used for production builds.
 */
export function wrapJsxs(originalJsxs: typeof jsxs) {
  return function litPatchedJsxs<P extends {children: ReactNode[]}>(
    type: ElementType<P>,
    props: P,
    key: string | undefined
  ) {
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

        return originalJsxs(
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
    return originalJsxs(type, props, key);
  };
}

/**
 * Produces a wrapped jsx-dev-runtime `jsxDEV` function that will server render
 * Lit components' shadow DOM.
 *
 * @param originalJsxDEV The original `jsxDEV` function to wrap.
 * @returns Wrapped `jsxs` function to be used for development builds.
 */
export function wrapJsxDev(originalJsxDEV: typeof jsxDEV) {
  return function litPatchedJsxDev<
    P extends {children?: ReactNode[] | ReactNode},
  >(
    type: ElementType<P>,
    props: P,
    key: string | undefined,
    isStaticChildren: boolean,
    source: Object,
    self: Object
  ) {
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

        return originalJsxDEV(
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

    return originalJsxDEV(type, props, key, isStaticChildren, source, self);
  };
}
