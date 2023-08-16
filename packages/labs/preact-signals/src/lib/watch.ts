/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {type Signal} from '@preact/signals-core';

class WatchDirective extends AsyncDirective {
  render(signal: Signal<unknown>) {
    let updateFromLit = true;
    signal.subscribe((value) => {
      if (!updateFromLit) {
        this.setValue(value);
      }
      updateFromLit = false;
    });
    return signal.value;
  }
}

/**
 * Renders a signal and subscribes to it, updating the part when the signal
 * changes.
 */
export const watch = directive(WatchDirective);
