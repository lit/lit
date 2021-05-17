/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {RenderOptions} from 'lit-html';

let count = 0;
export const generateElementName = () => `x-${count++}`;

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

const extendedWindow = window as unknown as WindowWithLitExtras;

export const getComputedStyleValue = (element: Element, property: string) =>
  extendedWindow.ShadyCSS
    ? extendedWindow.ShadyCSS.getComputedStyleValue(element, property)
    : getComputedStyle(element).getPropertyValue(property);

export const stripExpressionComments = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!--\??-->/g, '');

// Only test LitElement if ShadowRoot is available and either ShadyDOM is not
// in use or it is and LitElement platform support is available.
export const canTestLitElement =
  (window.ShadowRoot && !extendedWindow.ShadyDOM?.inUse) ||
  extendedWindow.litElementPlatformSupport;

export interface ShadyRenderOptions extends RenderOptions {
  scope?: string;
}
