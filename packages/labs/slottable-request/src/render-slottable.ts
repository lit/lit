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

type SlottableRenderers = {[name: string]: (data: unknown) => unknown};

class RenderSlottable extends AsyncDirective {
  private parent!: HTMLElement;
  private pending = false;
  private slottedChildren = new Map();
  private slottableRenderers: SlottableRenderers = {};
  private onSlotRequest = async (request: SlottableRequestEvent) => {
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
  render(_slottableRenderers: SlottableRenderers) {}
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
    this.parent.addEventListener('slottable-request', this.onSlotRequest);
  }
  override disconnected() {
    this.parent.removeEventListener('slottable-request', this.onSlotRequest);
  }
  override reconnected() {
    this.listen();
  }
}

export const renderSlottable = directive(RenderSlottable);
