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

import {ReactiveElement, PropertyValues} from '../reactive-element.js';

let count = 0;
export const generateElementName = () => `x-${count++}`;

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export const getComputedStyleValue = (element: Element, property: string) =>
  window.ShadyCSS
    ? window.ShadyCSS.getComputedStyleValue(element, property)
    : getComputedStyle(element).getPropertyValue(property);

export const stripExpressionComments = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!---->/g, '');

// Only test if ShadowRoot is available and either ShadyDOM is not
// in use or it is and platform support is available.
export const canTestReactiveElement =
  (window.ShadowRoot && !window.ShadyDOM?.inUse) ||
  window.reactiveElementPlatformSupport;

export class RenderingElement extends ReactiveElement {
  render(): string | undefined {
    return '';
  }
  update(changedProperties: PropertyValues) {
    const result = this.render();
    super.update(changedProperties);
    if (result !== undefined) {
      this.renderRoot.innerHTML = result;
    }
  }
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return values.reduce(
    (a: string, v: unknown, i: number) => a + v + strings[i + 1],
    strings[0]
  );
};
