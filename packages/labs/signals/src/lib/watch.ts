/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {DirectiveResult, Part, directive} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {Signal} from 'signal-polyfill';
import {SignalWatcher} from './signal-watcher.js';

// Watcher for directives that are not associated with a host element.
let effectsPending = false;
const hostlessWatcher = new Signal.subtle.Watcher(async () => {
  if (effectsPending) {
    return;
  }
  effectsPending = true;
  queueMicrotask(() => {
    effectsPending = false;
    for (const signal of hostlessWatcher.getPending()) {
      signal.get();
    }
    hostlessWatcher.watch();
  });
});

export class WatchDirective<T> extends AsyncDirective {
  private __host?: SignalWatcher;

  private __signal?: Signal.State<T> | Signal.Computed<T>;

  private __watcher?: Signal.subtle.Watcher;

  // We have to wrap the signal in a computed to work around a bug in the
  // signal-polyfill: https://github.com/proposal-signals/signal-polyfill/issues/27
  private __computed?: Signal.Computed<T | undefined>;

  private __watch() {
    if (this.__watcher !== undefined) {
      return;
    }
    this.__computed = new Signal.Computed(() => {
      this.setValue(this.__signal?.get());
      return this.__signal?.get();
    });
    this.__watcher = this.__host?._partUpdateWatcher ?? hostlessWatcher;
    this.__watcher.watch(this.__computed);
    // get to trigger watcher but untracked so it's not part of performUpdate
    Signal.subtle.untrack(() => this.__computed?.get());
  }

  private __unwatch() {
    if (this.__watcher !== undefined) {
      this.__watcher.unwatch(this.__computed!);
      this.__computed = undefined;
      this.__watcher = undefined;
    }
  }

  render(signal: Signal.State<T> | Signal.Computed<T>): T {
    // This would only be called if render is called directly, like in SSR.
    return Signal.subtle.untrack(() => signal.get());
  }

  override update(
    part: Part,
    [signal]: [signal: Signal.State<T> | Signal.Computed<T>]
  ) {
    this.__host ??= part.options?.host as SignalWatcher;
    if (signal !== this.__signal && this.__signal !== undefined) {
      // Unwatch the old signal
      this.__unwatch();
    }
    this.__signal = signal;
    this.__watch();
    // We use untrack() so that the signal access is not tracked by the watcher
    // created by SignalWatcher. This means that an can use both SignalWatcher
    // and watch() and a signal update won't trigger a full element update if
    // it's only passed to watch() and not otherwise accessed by the element.
    return Signal.subtle.untrack(() => this.__signal!.get());
  }

  protected override disconnected(): void {
    this.__unwatch();
  }

  protected override reconnected(): void {
    this.__watch();
  }
}

export type WatchDirectiveFunction = <T>(
  signal: Signal.State<T> | Signal.Computed<T>
) => DirectiveResult<typeof WatchDirective<T>>;

/**
 * Renders a signal and subscribes to it, updating the part when the signal
 * changes.
 *
 * watch() can only be used in a reactive element that applies the
 * SignalWatcher mixin.
 */
export const watch = directive(WatchDirective) as WatchDirectiveFunction;
