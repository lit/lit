/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {css, html} from 'lit';
import {classMap} from 'lit/directives/class-map.js';

/**
 * @typedef {import('lit').LitElement} LitElement
 */

/**
 * @template T
 * @typedef {new (...args: any[]) => T} Constructor
 */

/** @typedef {{
  highlight: boolean;
  renderHighlight(content: unknown): unknown;
}} HighlightableInterface */

/**
 * Hilightable mixin
 * @mixin
 * @template {Constructor<LitElement>} T
 * @param {string} message
 * @param {T} superClass
 * @return {Constructor<HighlightableInterface> & T}
 */
export const Highlightable = (message, superClass) => {
  console.log(message);
  class HighlightableElement extends superClass {
    // Adds some styles...
    static styles = [
      superClass.styles ?? [],
      css`
        .highlight {
          background: yellow;
        }
      `,
    ];

    static properties = {
      highlight: {type: Boolean},
    };

    constructor() {
      super();
      this.highlight = false;
    }

    /**
     * @param {unknown} content
     */
    renderHighlight(content) {
      return html` <div class=${classMap({highlight: this.highlight})}>
        ${content}
      </div>`;
    }
  }
  return HighlightableElement;
};

/** @typedef {{
  a: string;
}} IA */

/** @typedef {{
  a: number;
}} IB */

/** @typedef {{
  c: boolean;
}} IC */

/**
 * Mixin A - const assignment to arrow function
 * @mixin
 * @template {Constructor<LitElement>} T
 * @param {string} x
 * @param {T} superClass
 * @param {Constructor<{z: string}>} z
 * @return {Constructor<IA> & T}
 */
export const A = (x, superClass, z) => {
  console.log(x, z);
  class A extends superClass {
    static properties = {
      a: {},
    };

    /**
     * @private
     */
    pa = true;

    constructor() {
      super();
      this.a = 'hi';
    }
  }
  return A;
};

/**
 * Mixin B - function declaration
 * @mixin
 * @template {Constructor<LitElement>} T
 * @param {string} s
 * @param {Constructor<{z: string}>} y
 * @param {T} superClass
 * @return {Constructor<IB> & T}
 */
export function B(s, y, superClass) {
  console.log(s, y);
  class B extends superClass {
    static properties = {
      b: {type: Number},
    };

    /**
     * @private
     */
    pb = true;

    constructor() {
      super();
      this.b = 5;
    }
  }
  return B;
}

/**
 * Mixin B - function declaration
 * @mixin
 * @template {Constructor<LitElement>} T
 * @param {T} superClass
 * @return {Constructor<IC> & T}
 */
export const C = function C(superClass) {
  class C extends superClass {
    static properties = {
      c: {type: Boolean},
    };

    /**
     * @private
     */
    pc = true;

    constructor() {
      super();
      this.c = false;
    }
  }
  return C;
};

/**
 * Mixin with sub-mixin with multiple params
 * @mixin
 * @template {Constructor<LitElement>} T
 * @param {T} superClass
 */
export const ChildWithMultipleParams = function ChildWithMultipleParams(
  superClass,
  secondArg
) {
  class ChildWithMultipleParams extends Highlightable(secondArg, superClass) {}
  return ChildWithMultipleParams;
};
