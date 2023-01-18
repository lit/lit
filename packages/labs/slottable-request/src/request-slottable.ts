/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, nothing} from 'lit';
import {
  directive,
  AsyncDirective,
  ChildPart,
  DirectiveParameters,
} from 'lit/async-directive.js';
import {SlottableRequestEvent, remove} from './slottable-request-event.js';

class RequestSlottable<T> extends AsyncDirective {
  name!: string;
  key: string | undefined;
  host!: HTMLElement;
  data!: T;
  slotName!: string;
  fallback: ((data: T) => unknown) | undefined;
  shouldRenderFallback = false;
  part!: ChildPart;
  render(
    _name: string,
    _data: T,
    _keyOrFallback?: string | number | ((data: T) => unknown),
    _fallback?: (data: T) => unknown
  ) {}
  override update(
    part: ChildPart,
    [name, data, keyOrFallback, fallback]: DirectiveParameters<this>
  ) {
    this.part = part;
    this.name = name;
    this.data = data;
    this.key =
      keyOrFallback === undefined || typeof keyOrFallback === 'function'
        ? undefined
        : String(keyOrFallback);
    const fb = typeof keyOrFallback === 'function' ? keyOrFallback : fallback;
    // Optimization: Only render the fallback template if the slottable request
    // wasn't fulfilled by the time we paint; once it's there, don't bother
    // removing it (TBD, this is a choice; maybe we want to add a slotchange event
    // and unrender the fallback if it's no longer needed; all of this might
    // want to be factored out to a `slotFallback()` directive helper since it's
    // generally useful)
    if (
      fb !== undefined &&
      this.fallback === undefined &&
      !this.shouldRenderFallback
    ) {
      requestAnimationFrame(() => {
        if (
          (this.part.startNode?.nextSibling as HTMLSlotElement)?.assignedNodes({
            flatten: true,
          }).length === 0
        ) {
          this.shouldRenderFallback = true;
          this.setValue(this.renderSlot());
        }
      });
    }
    this.fallback = fb;
    if (part.options?.host === undefined) {
      throw new Error(`${this.constructor.name} must be used in a LitElement.`);
    }
    this.host = part.options.host as HTMLElement;
    const request = new SlottableRequestEvent(name, data, this.key);
    this.slotName = request.slotName;
    this.host.dispatchEvent(request);
    return this.renderSlot();
  }
  private renderSlot() {
    return html`<slot name="${this.slotName}"
      >${this.shouldRenderFallback ? this.fallback?.(this.data) : nothing}</slot
    >`;
  }
  override disconnected() {
    this.host.dispatchEvent(
      new SlottableRequestEvent(this.name, remove, this.key)
    );
  }
}

export const requestSlot = directive(RequestSlottable);
