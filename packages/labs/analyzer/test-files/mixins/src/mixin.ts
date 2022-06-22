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
