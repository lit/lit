/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

/**
 * A named type used by an inherited reactive property. The generated wrapper
 * must import this even though it is only referenced via the mixin.
 */
export type MixedVariant = 'primary' | 'secondary';

/**
 * Some generic mixin
 * @mixin
 */
export const mixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class Mixed extends superClass {
    @property()
    public mixedProp?: number;

    @property()
    public mixedVariant?: MixedVariant;
  }
  return Mixed as T;
};

/**
 * My awesome element
 */
@customElement('element-mixins')
export class ElementMixins extends mixin(LitElement) {
  override render() {
    return html`<h1>Mixins</h1>`;
  }
}
