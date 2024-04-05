/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {classMap} from 'lit/directives/class-map.js';
import {property} from 'lit/decorators/property.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

export declare class HighlightableInterface {
  highlight: boolean;
  renderHighlight(content: unknown): unknown;
}

/**
 * Hilightable mixin
 * @mixin
 */
export const Highlightable = <T extends Constructor<LitElement>>(
  message: string,
  superClass: T
) => {
  console.log(message);
  class HighlightableElement extends superClass {
    // Adds some styles...
    static styles = [
      (superClass as unknown as typeof LitElement).styles ?? [],
      css`
        .highlight {
          background: yellow;
        }
      `,
    ];

    @property({type: Boolean}) highlight = false;

    renderHighlight(content: unknown) {
      return html` <div class=${classMap({highlight: this.highlight})}>
        ${content}
      </div>`;
    }
  }
  return HighlightableElement as Constructor<HighlightableInterface> & T;
};

export declare class IA {
  a: string;
}

export declare class IB {
  b: number;
}

export declare class IC {
  c: boolean;
}

/**
 * Mixin A - const assignment to arrow function
 * @mixin
 */
export const A = <T extends Constructor<LitElement>>(
  x: string,
  superClass: T,
  z: Constructor<{z: string}>
) => {
  console.log(x, z);
  class A extends superClass {
    private pa = true;
    @property()
    a = 'hi';
  }
  return A as Constructor<IA> & T;
};

/**
 * Mixin B - function declaration
 * @mixin
 */
export function B<T extends Constructor<LitElement>>(
  s: string,
  y: Constructor<{z: string}>,
  superClass: T
) {
  console.log(s, y);
  class B extends superClass {
    private pb = true;
    @property({type: Number})
    b = 5;
  }
  return B as Constructor<IB> & T;
}

/**
 * Mixin C - const assignment to function expression
 * @mixin
 */
export const C = function C<T extends Constructor<LitElement>>(superClass: T) {
  class C extends superClass {
    private pc = true;
    @property({type: Boolean})
    c = false;
  }
  return C as Constructor<IC> & T;
};

/**
 * Mixin with sub-mixin with multiple params
 * @mixin
 */
export const ChildWithMultipleParams = function ChildWithMultipleParams<
  T extends Constructor<LitElement>,
>(superClass: T, secondArg: string) {
  class ChildWithMultipleParams extends Highlightable(secondArg, superClass) {}
  return ChildWithMultipleParams;
};
