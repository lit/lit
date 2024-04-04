/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {PropertyDeclaration, PropertyValueMap, ReactiveElement} from 'lit';
import {Signal} from 'signal-polyfill';
import {WatchDirective} from './watch.js';

type ReactiveElementConstructor = abstract new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => ReactiveElement;

export interface SignalWatcher extends ReactiveElement {
  updateWatchDirective(d: WatchDirective<unknown>): void;
}

type SignalWatcherInterface = SignalWatcher;

/**
 * Adds the ability for a LitElement or other ReactiveElement class to
 * watch for access to signals during the update lifecycle and trigger a new
 * update when signals values change.
 */
export function SignalWatcher<T extends ReactiveElementConstructor>(
  Base: T
): T {
  abstract class SignalWatcher extends Base implements SignalWatcherInterface {
    private __watcher?: Signal.subtle.Watcher;

    private __watch() {
      if (this.__watcher === undefined) {
        // We create a fresh computed instead of just re-using the existing one
        // because of https://github.com/proposal-signals/signal-polyfill/issues/27
        this.__performUpdateSignal = new Signal.Computed(() => {
          this.__forceUpdateSignal.get();
          super.performUpdate();
        });
        const watcher = (this.__watcher = new Signal.subtle.Watcher(() => {
          if (this.__forcingUpdate === false) {
            this.requestUpdate();
          }
          watcher.watch();
        }));
        this.__watcher.watch(this.__performUpdateSignal);
      }
    }

    private __unwatch() {
      if (this.__watcher !== undefined) {
        this.__watcher!.unwatch(this.__performUpdateSignal!);
        this.__performUpdateSignal = undefined;
        this.__watcher = undefined;
      }
    }

    /**
     * Used to force an uncached read of the __updateSignal when we need to read
     * the current value during an update.
     *
     * If https://github.com/tc39/proposal-signals/issues/151 is resolved, we
     * won't need this.
     */
    private __forceUpdateSignal = new Signal.State(0);

    private __forcingUpdate = false;

    /**
     * A computed signal that wraps performUpdate() so that all signals that are
     * accessed during the update lifecycle are tracked.
     *
     * __forceUpdateSignal is used to force an uncached read of this signal
     * because updates may easily depend on non-signal values, so we must always
     * re-run it.
     */
    private __performUpdateSignal?: Signal.Computed<void>;

    /**
     * Whether or not the next update should perform a full render, or if only
     * pending watches should be committed.
     *
     * If requestUpdate() was called only because of watch() directive updates,
     * then we can just commit those directives without a full render. If
     * requestUpdate() was called for any other reason, we need to perform a
     * full render, and don't need to separately commit the watch() directives.
     *
     * This is set to `true` initially, and whenever requestUpdate() is called
     * outside of a watch() directive update. It is set to `false` when
     * update() is called, so that a requestUpdate() is required to do another
     * full render.
     */
    private __doFullRender = true;

    /**
     * Set of watch directives that have been updated since the last update.
     * These will be committed in update() to ensure that the latest value is
     * rendered and that all updates are batched.
     */
    private __pendingWatches = new Set<WatchDirective<unknown>>();

    protected override performUpdate() {
      // Always enable watching before an update, even if disconnected, so that
      // we can track signals that are accessed during the update.
      this.__watch();
      // Force an uncached read of __performUpdateSignal
      this.__forcingUpdate = true;
      this.__forceUpdateSignal?.set(this.__forceUpdateSignal.get() + 1);
      this.__forcingUpdate = false;
      // Always read from the signal to ensure that it's tracked
      this.__performUpdateSignal!.get();
    }

    protected override update(
      changedProperties: PropertyValueMap<this> | Map<PropertyKey, unknown>
    ): void {
      if (this.__doFullRender) {
        // Force future updates to not perform full renders by default.
        this.__doFullRender = false;
        super.update(changedProperties);
      } else {
        // For a partial render, just commit the pending watches.
        this.__pendingWatches.forEach((d) => d.commmit());
        this.__pendingWatches.clear();
        // Since we don't call super.update(), we need to set this to false
        this.isUpdatePending = false;
      }
    }

    override requestUpdate(
      name?: PropertyKey | undefined,
      oldValue?: unknown,
      options?: PropertyDeclaration<unknown, unknown> | undefined
    ): void {
      this.__doFullRender = true;
      super.requestUpdate(name, oldValue, options);
    }

    override connectedCallback(): void {
      this.__watch();
      super.connectedCallback();
      // Because we might have missed some signal accesses while disconnected,
      // we need to force a full render on the next update.
      this.requestUpdate();
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      // Clean up the watcher to avoid memory leaks from signals holding
      // references to the element. This means that while disconnected, regular
      // reactive property updates will trigger a re-render, but signal updates
      // will not. To ensure that current signal usage is still correctly
      // tracked, we re-enable watching in performUpdate() even while
      // disconnected. From that point on, a disconnected element will be
      // retained by the signals it accesses during the update lifecycle.
      // We may want to use a WeakMap inside the watcher to avoid a strong
      // reference to the element.
      queueMicrotask(() => {
        if (this.isConnected === false) {
          this.__unwatch();
        }
      });
    }

    updateWatchDirective(d: WatchDirective<unknown>): void {
      this.__pendingWatches.add(d);
      // requestUpdate() will set __doFullRender to true, so remember the
      // current value and restore it after calling requestUpdate().
      const shouldRender = this.__doFullRender;
      this.requestUpdate();
      this.__doFullRender = shouldRender;
    }
  }
  return SignalWatcher;
}
