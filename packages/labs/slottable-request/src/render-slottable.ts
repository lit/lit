/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {
  directive,
  AsyncDirective,
  ChildPart,
  DirectiveParameters,
} from 'lit/async-directive.js';
import {repeat} from 'lit/directives/repeat.js';
import {SlottableRequestEvent, remove} from './slottable-request-event.js';

export type SlottableDataMap = {[name: string]: unknown};

type SlottableRenderers<T extends SlottableDataMap> = {
  [P in keyof T]: (data: T[P]) => unknown;
};

class RenderSlottable<T extends SlottableDataMap> extends AsyncDirective {
  private parent!: HTMLElement;
  private pending = false;
  private slottedChildren = new Map();
  private slottableRenderers!: SlottableRenderers<T>;
  private onSlotRequest = async <N extends Extract<keyof T, 'string'>>(
    request: SlottableRequestEvent<N, T[N]>
  ) => {
    if (request.data === remove) {
      this.slottedChildren.delete(request.slotName);
    } else {
      this.slottedChildren.set(
        request.slotName,
        html`<div
          style="display: contents !important;"
          slot="${request.slotName}"
        >
          ${this.slottableRenderers[request.name]?.(request.data)}
        </div>`
      );
    }
    if (this.pending !== true) {
      this.pending = true;
      await 0;
      this.pending = false;
      this.setValue(
        repeat(
          this.slottedChildren,
          ([key]) => key,
          ([_, val]) => val
        )
      );
    }
  };
  render(_slottableRenderers: SlottableRenderers<T>): void {}
  override update(
    part: ChildPart,
    [slottableRenderers]: DirectiveParameters<this>
  ) {
    this.slottableRenderers = slottableRenderers;
    if (this.parent === undefined) {
      this.parent = part.parentNode as HTMLElement;
      this.listen();
    }
  }
  listen() {
    this.parent.addEventListener(
      'slottable-request',
      this.onSlotRequest as unknown as EventListener
    );
  }
  override disconnected() {
    this.parent.removeEventListener(
      'slottable-request',
      this.onSlotRequest as unknown as EventListener
    );
  }
  override reconnected() {
    this.listen();
  }
}

type renderSlottableInterface = <T extends SlottableDataMap>(
  slottableRenderers: SlottableRenderers<T>
) => unknown;

/**
 * Lit directive to handle a `slottable-request` event by rendering slottable
 * content based on a provided object mapping named slottable request types to
 * template functions.
 *
 * Example ():
 * ```js
 * html`
 *   <awesome-element>
 *     ${renderSlottable({
 *       header: (text: string) => html`<h1>${text></h1>}`)
 *       item: (item: Item) => html`<div>${item.text></div>}`)
 *     })}
 *   </awesome-element>
 * `
 * ```
 *
 * The directive automatically wraps template instances in a `display: contents`
 * wrapper with the slot name provided in the event.
 *
 * @param slottableRenderers An object mapping slottable request names to Lit
 *   template functions that receive a single argument containing the instance-
 *   specific data to render.
 */
export const renderSlottable = directive(
  RenderSlottable
) as renderSlottableInterface;
