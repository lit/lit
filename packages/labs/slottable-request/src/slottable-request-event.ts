/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Requests a slotted child be added/updated/removed from the light DOM of the
 * dispatching element.
 *
 * Listeners of the event should render DOM for the given slottable `name` using
 * the event's `data`, and assign the `slotName` to any rendered nodes' `slot`
 * attribute.
 *
 * Requestors should construct the event using a unique `name` per type of
 * slotted content, and if there are more than one instance for that type (e.g.
 * a list item might have multiple instances), the optional `key` field should
 * be passed, generating a unique `slotName` for that `name`+`key` combination.
 * Requestors should pass any `data` unique to the requested slottable content,
 * or the `remove` symbol to indicate slottables for the associated `slotName`
 * should be removed.
 */
export class SlottableRequestEvent<
  N extends string = 'unknown',
  D = unknown
> extends Event {
  readonly data: D | typeof remove;
  readonly name: N;
  readonly slotName: string;
  /**
   * @param name A name indicating the type of slottable content that is being
   * requested. Examples might include `header` or `item`.
   * @param data Instance-specific data that the listener should use to render
   * the slottable content.
   * @param key An optional key, required when more than once instance of a given
   * `name` is requested by the same component, such as when requesting individual
   * list items of the same type.
   */
  constructor(name: N, data: D, key?: string) {
    super('slottable-request', {bubbles: false, composed: false});
    this.name = name;
    this.data = data;
    this.slotName = key !== undefined ? `${name}.${key}` : name;
  }
}

/**
 * Sentinel value passed in the `SlottableRequestEvent`'s `data`
 * field to indicate the given `slotName` should be removed
 * from the DOM.
 */
export const remove = Symbol('remove-slottable');

declare global {
  interface HTMLElementEventMap {
    'slottable-request': SlottableRequestEvent;
  }
}
