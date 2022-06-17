/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '../reactive-element.js';

let count = 0;
export const generateElementName = () => `x-${count++}`;

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export const getComputedStyleValue = (
  element: Element,
  property = 'border-top-width'
): string =>
  (window.ShadyCSS
    ? window.ShadyCSS.getComputedStyleValue(element, property)
    : getComputedStyle(element).getPropertyValue(property)
  ).trim();

export const stripExpressionComments = (html: string) =>
  html.replace(/<!--\?lit\$[0-9]+\$-->|<!---->/g, '');

const DEV_MODE = true;

// Only test if ShadowRoot is available and either ShadyDOM is not
// in use or it is and platform support is available.
export const canTestReactiveElement =
  (window.ShadowRoot && !window.ShadyDOM?.inUse) ||
  window[`reactiveElementPolyfillSupport${DEV_MODE ? `DevMode` : ``}`];

export class RenderingElement extends ReactiveElement {
  render(): string | undefined {
    return '';
  }
  override update(changedProperties: PropertyValues) {
    const result = this.render();
    super.update(changedProperties);
    if (result !== undefined) {
      // Note, don't use `innerHTML` here to avoid a polyfill issue
      // where `innerHTML` is not patched by CE on shadowRoot.
      // https://github.com/webcomponents/custom-elements/issues/73
      Array.from(this.renderRoot.childNodes).forEach((e) => {
        // Leave any style elements that might be simulating
        // adoptedStylesheets
        if ((e as Element).localName !== 'style') {
          this.renderRoot.removeChild(e);
        }
      });
      const div = document.createElement('div');
      div.innerHTML = result;
      const ref = this.renderRoot.firstChild;
      Array.from(div.childNodes).forEach((e) => {
        this.renderRoot.insertBefore(e, ref);
      });
    }
  }
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return values.reduce(
    (a: string, v: unknown, i: number) => a + v + strings[i + 1],
    strings[0]
  );
};

export const createShadowRoot = (host: HTMLElement) => {
  if (window.ShadyDOM && window.ShadyDOM.inUse) {
    host = window.ShadyDOM.wrap(host) as HTMLElement;
    if (window.ShadyCSS) {
      window.ShadyCSS.prepareTemplateStyles(
        document.createElement('template'),
        host.localName
      );
      window.ShadyCSS.styleElement(host);
    }
  }
  return host.attachShadow({mode: 'open'});
};
