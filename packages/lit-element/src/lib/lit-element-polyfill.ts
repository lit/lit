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
import {LitElement, CSSResultArray, CSSResult} from '../lit-element.js';
import {UpdatingElement} from './updating-element.js';
// TODO(sorvell) Add shady-render package.
import {render, RenderOptions} from 'lit-html';
export * from '../lit-element.js';

if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
  LitElement.render = (
    result: unknown,
    container: HTMLElement | DocumentFragment,
    options: RenderOptions
  ) => {
    console.log('Note, this should be shady-render.');
    render(result, container, options);
  };

  const baseConnectedCallback = UpdatingElement.prototype.connectedCallback;
  LitElement.prototype.connectedCallback = function (this: LitElement) {
    baseConnectedCallback.call(this);
    // Note, first update/render handles styleElement so we only call this if
    // connected after first update.
    if (this.hasUpdated) {
      window.ShadyCSS!.styleElement(this);
    }
  };

  (LitElement.prototype as any).adoptStyles = function (
    this: LitElement,
    styles: CSSResultArray
  ) {
    if (!(window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot)) {
      return;
    }
    window.ShadyCSS!.ScopingShim!.prepareAdoptedCssText(
      styles.map((s) => (s as CSSResult).cssText),
      this.localName
    );
  };
}
