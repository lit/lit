/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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
 * @module lit-html
 */

/**
 * The Part interface represents a dynamic part of a template instance rendered
 * by lit-html.
 */
export interface Part {
  value: unknown;

  /**
   * Sets the current part value, but does not write it to the DOM.
   * @param value The value that will be committed.
   */
  setValue(value: unknown): void;

  /**
   * Commits the current part value, cause it to actually be written to the DOM.
   */
  commit(): void;
}

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange: object = {};

/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
export const nothing = {};
