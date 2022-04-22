/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

let count = 0;
export const generateElementName = () => `x-${count++}`;

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export const getComputedStyleValue = (element: Element, property: string) =>
  window.ShadyCSS
    ? window.ShadyCSS.getComputedStyleValue(element, property)
    : getComputedStyle(element).getPropertyValue(property);
