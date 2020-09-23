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

/**
 * LitElement patch to support browsers without native web components.
 *
 * @packageDocumentation
 */
import {
  LitElement,
  CSSResultFlatArray,
  CSSResultOrNative,
  cssResultFromStyleSheet,
} from '../lit-element.js';
import {
  render,
  needsPolyfill,
  cssForScope,
} from 'lit-html/shady-render.js';
import {RenderOptions} from 'lit-html';
export * from '../lit-element.js';

if (needsPolyfill) {
  console.log(
    '%c Making LitElement compatible with ShadyDOM/CSS.',
    'color: lightgreen; font-style: italic'
  );

  const SCOPE_KEY = '__localName';
  interface PolyfilledLitElement extends LitElement {
    __baseConnectedCallback: () => void;
  }

  type LitElementConstructor = typeof LitElement;
  interface PolyfilledLitElementConstructor extends LitElementConstructor {
    [SCOPE_KEY]: string;
  }
  /**
   * LitElement patches:
   * * render: uses shady-render
   * * adoptStyles: populates scopeData for the element
   * * connectedCallback: applies ShadyCSS custom properties shimming
   */

  /**
   * Patch `render` to be `shady-render`
   */
  Object.defineProperty(LitElement, 'render', {
    value: function (
      this: PolyfilledLitElementConstructor,
      result: unknown,
      container: HTMLElement | DocumentFragment,
      options: RenderOptions
    ) {
      render(result, container, options, this[SCOPE_KEY]);
    },
    enumerable: true,
    configurable: true,
  });

  /**
   * Patch to initialize the `scopeData` for the element.
   * The scope data includes:
   * * name: element name
   * * css: array of cssText to apply
   * * isStyled: boolean indicating if styling has been applied
   */
  // TODO(sorvell): This could be done in `render` by reading `elementStyles`
  // if there were a way to get the element name
  // (patch define or have LitElement pass it?).
  function adoptStyles(this: PolyfilledLitElement, styles: CSSResultFlatArray) {
    if (this.constructor.hasOwnProperty(SCOPE_KEY)) {
      return;
    }
    const name = ((this.constructor as PolyfilledLitElementConstructor)[
      SCOPE_KEY
    ] = this.localName);
    const css = cssForScope(name);
    if (css !== undefined) {
      css.push(
        ...styles.map(
          (v: CSSResultOrNative) =>
            (v instanceof CSSStyleSheet ? cssResultFromStyleSheet(v) : v)
              .cssText
        )
      );
    }
  }

  /**
   * Patch connectedCallback to apply ShadyCSS custom properties shimming.
   */
  function connectedCallback(this: PolyfilledLitElement) {
    this.__baseConnectedCallback();
    window.ShadyCSS!.styleElement(this);
  }

  Object.defineProperties(LitElement.prototype, {
    adoptStyles: {value: adoptStyles, enumerable: true, configurable: true},
    connectedCallback: {
      value: connectedCallback,
      enumerable: true,
      configurable: true,
    },
    __baseConnectedCallback: {
      value: LitElement.prototype.connectedCallback,
      enumerable: true,
      configurable: true,
    },
  });
}
