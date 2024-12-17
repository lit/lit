/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ReactiveElement} from '../reactive-element.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = abstract new (...args: any[]) => T;

export const elementInternals: unique symbol = Symbol('SignalElementInternals');

export interface ElementInteralsHost extends ReactiveElement {
  get [elementInternals](): ElementInternals;
}
type ElementInteralsHostInterface = ElementInteralsHost;

export interface ElementInteralsHostConstructor {
  role?: ElementInternals['role'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): ElementInteralsHost;
}

/**
 * A mixin to apply attaching element internals to the given element class.
 * The ElementInternals instance can be accessed via `elementInternals` symbol.
 *
 * @example
 *
 * ```ts
 * class MyElement extends ElementInternalsHost(ReactiveElement) {
 *   static override role = 'button';
 *
 *   override connectedCallback(): void {
 *     super.connectedCallback();
 *     this[elementInternals].ariaPressed = 'false';
 *   }
 * }
 * ```
 *
 * @param base The base class to apply the mixin to.
 * @returns A new class body with attached element internals.
 */
export function ElementInternalsHost<T extends Constructor<ReactiveElement>>(
  base: T
): T & ElementInteralsHostConstructor {
  abstract class ElementInternalsHostMixin
    extends base
    implements ElementInteralsHostInterface
  {
    #internals: ElementInternals;

    get [elementInternals]() {
      return this.#internals;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const internals = this.attachInternals();
      this.#internals = internals;
      internals.role =
        (this.constructor as ElementInteralsHostConstructor).role ?? null;
    }
  }
  return ElementInternalsHostMixin as unknown as Constructor<ElementInteralsHostInterface> &
    T &
    ElementInteralsHostConstructor;
}
