/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ReactiveElement,
  PropertyValues,
  getAdoptedStyles,
} from '@lit/reactive-element.js';

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
      const styleElements = getAdoptedStyles(
        this.renderRoot as ShadowRoot
      ).filter(
        (s) => (s as HTMLElement).nodeType === Node.ELEMENT_NODE
      ) as HTMLElement[];
      const div = document.createElement('div');
      div.innerHTML = result;
      Array.from(this.renderRoot.childNodes).forEach((e) => {
        this.renderRoot.removeChild(e);
      });
      [...Array.from(div.childNodes), ...styleElements].forEach((e) => {
        this.renderRoot.appendChild(e);
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

const testingWithShadyCSS =
  window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow;

export const getLinkWithSheet = async (css: string) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // Safari needs this so it doesn't consider the link x-origin.
  link.crossOrigin = 'anonymous';
  link.href = `data:text/css;charset=utf-8, ${css}`;
  // Ensure the link has a sheet when testing with ShadyCSS so that it can
  // attempt to build the cssText to shim via the sheet's cssRules.
  if (testingWithShadyCSS) {
    document.head.append(link);
    await ensureLinkLoaded(link);
  }
  return link;
};

export const ensureLinkLoaded = async (link: HTMLLinkElement) => {
  if (!link.sheet) {
    await new Promise((r) => {
      link.addEventListener('load', r, {once: true});
    });
  }
};
