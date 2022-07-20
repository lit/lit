/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

const AMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class AMixin extends BMixin(superClass) {}
  return AMixin as T;
};

const BMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class BMixin extends CMixin(superClass) {}
  return BMixin as T;
};

const CMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class CMixin extends superClass {}
  return CMixin as T;
};

/**
 * My awesome element
 * @fires a-changed - An awesome event to fire
 */
@customElement('element-a')
export class ElementA extends AMixin(LitElement) {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  @property()
  foo?: string;

  override render() {
    return html`<h1>${this.foo}</h1>`;
  }
}
