/**
 * @license
 * Copyright 2022 Google LLC
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
 * Mixin A
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
    a = 'hi';
  }
  return A as Constructor<IA> & T;
};

/**
 * Mixin B
 * @mixin
 */
export const B = <T extends Constructor<LitElement>>(
  s: string,
  y: Constructor<{z: string}>,
  superClass: T
) => {
  console.log(s, y);
  class B extends superClass {
    private pb = true;
    b = 5;
  }
  return B as Constructor<IB> & T;
};

/**
 * Mixin C
 * @mixin
 */
export const C = <T extends Constructor<LitElement>>(superClass: T) => {
  class C extends superClass {
    private pc = true;
    c = true;
  }
  return C as Constructor<IC> & T;
};
