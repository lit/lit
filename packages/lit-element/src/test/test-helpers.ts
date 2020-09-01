/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const stripExpressionDelimeters = (html: string) =>
    html.replace(/<!---->/g, '');

let count = 0;
export const generateElementName = () => `x-${count++}`;

export const nextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(resolve));

export const getComputedStyleValue = (element: Element, property: string) =>
    window.ShadyCSS ? window.ShadyCSS.getComputedStyleValue(element, property) :
                      getComputedStyle(element).getPropertyValue(property);
