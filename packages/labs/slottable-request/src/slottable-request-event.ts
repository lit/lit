/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Requests a slotted child be added/updated/removed from the light DOM of the
 * dispatching element.
 */
export class SlottableRequestEvent extends Event {
  readonly data: unknown;
  readonly name: string;
  readonly slotName: string;
  constructor(name: string, data: unknown, key?: string) {
    super('slottable-request', {bubbles: false, composed: false});
    this.name = name;
    this.data = data;
    this.slotName = key !== undefined ? `${name}.${key}` : name;
  }
}

export const remove = Symbol('remove-slottable');

declare global {
  interface HTMLElementEventMap {
    'slottable-request': SlottableRequestEvent;
  }
}
