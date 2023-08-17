/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {type Signal} from '@preact/signals-core';

class WatchDirective extends AsyncDirective {
  private __signal?: Signal;
  private __dispose?: () => void;

  override render(signal: Signal<unknown>) {
    let updateFromLit = true;
    if (signal !== this.__signal) {
      this.__dispose?.();
      this.__signal = signal;
      this.__dispose = signal.subscribe((value) => {
        if (!updateFromLit) {
          this.setValue(value);
        }
      });
    }
    updateFromLit = false;
    return signal.value;
  }

  protected override disconnected(): void {
    this.__dispose?.();
  }

  protected override reconnected(): void {
    this.__signal?.subscribe((value) => {
      this.setValue(value);
    });
  }
}

/**
 * Renders a signal and subscribes to it, updating the part when the signal
 * changes.
 */
export const watch = directive(WatchDirective);
