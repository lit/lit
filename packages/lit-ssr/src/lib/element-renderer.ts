/// <reference lib="dom" />

/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

export type Constructor<T> = {new (): T};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const escapeHtml = require('escape-html') as typeof import('escape-html');

import {RenderInfo} from './render-lit-html.js';

/**
 * An object that renders elements of a certain type.
 */
export abstract class ElementRenderer {
  constructor(public element: HTMLElement) {}

  /**
   * Should implement server-appropriate implementation of connectedCallback
   */
  abstract connectedCallback(): void;

  /**
   * Should implement server-appropriate implementation of attributeChangedCallback
   */
  abstract attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void;

  /**
   * Handles setting a property.
   *
   * Default implementation sets the property on the renderer's element instance.
   *
   * @param name Name of the property
   * @param value Value of the property
   */
  setProperty(name: string, value: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any)[name] = value;
  }

  /**
   * Handles setting an attribute on an element.
   *
   * Default implementation calls `setAttribute` on the renderer's element
   * instance, and calls the abstract `attributeChangedCallback` on the
   * renderer.
   *
   * @param name Name of the attribute
   * @param value Value of the attribute
   */
  setAttribute(name: string, value: string) {
    const old = this.element.getAttribute(name);
    this.element.setAttribute(name, value);
    this.attributeChangedCallback(name, old, value);
  }

  /**
   * Render a single element's ShadowRoot children.
   */
  abstract renderShadow(): IterableIterator<string>;

  /**
   * Render an element's light DOM children.
   */
  abstract renderLight(renderInfo: RenderInfo): IterableIterator<string>;

  /**
   * Render an element's attributes.
   *
   * Default implementation serializes all attributes on the element instance.
   */
  *renderAttributes(): IterableIterator<string> {
    const {attributes} = this.element;
    for (
      let i = 0, name, value;
      i < attributes.length && ({name, value} = attributes[i]);
      i++
    ) {
      if (value === '') {
        yield ` ${name}`;
      } else {
        yield ` ${name}="${escapeHtml(value)}"`;
      }
    }
  }
}
