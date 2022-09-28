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

export const getComputedStyleValue = (element: Element, property: string) =>
  window.ShadyCSS
    ? window.ShadyCSS.getComputedStyleValue(element, property)
    : getComputedStyle(element).getPropertyValue(property);

const DEV_MODE = true;

// Only test LitElement if ShadowRoot is available and either ShadyDOM is not
// in use or it is and LitElement platform support is available.
export const canTestLitElement =
  (window.ShadowRoot && !window.ShadyDOM?.inUse) ||
  window[`litElementPolyfillSupport${DEV_MODE ? `DevMode` : ``}`];

export interface ShadyRenderOptions extends RenderOptions {
  scope?: string;
}
