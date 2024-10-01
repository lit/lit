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
  _updateWatchDirective(d: WatchDirective<unknown>): void;
  _clearWatchDirective(d: WatchDirective<unknown>): void;
}

interface SignalWatcherInterface extends SignalWatcher {}
interface SignalWatcherInternal extends SignalWatcher {
  __forcingUpdate: boolean;
}

const signalWatcherBrand: unique symbol = Symbol('SignalWatcherBrand');

// Memory management: We need to ensure that we don't leak memory by creating a
// reference cycle between an element and its watcher, which then it kept alive
// by the signals it watches. To avoid this, we break the cycle by using a
// WeakMap to store the watcher for each element, and a FinalizationRegistry to
// clean up the watcher when the element is garbage collected.

const elementFinalizationRegistry = new FinalizationRegistry<{
  watcher: Signal.subtle.Watcher;
  signal: Signal.Computed<void>;
}>(({watcher, signal}) => {
  watcher.unwatch(signal);
});

const elementForWatcher = new WeakMap<
  Signal.subtle.Watcher,
  SignalWatcherInternal
>();

/**
 * Adds the ability for a LitElement or other ReactiveElement class to
 * watch for access to signals during the update lifecycle and trigger a new
 * update when signals values change.
 */
export function SignalWatcher<T extends ReactiveElementConstructor>(
  Base: T
): T {
  // Only apply the mixin once
  if ((Base as typeof SignalWatcher)[signalWatcherBrand] === true) {
    console.warn(
      'SignalWatcher should not be applied to the same class more than once.'
    );
    return Base;
  }

  abstract class SignalWatcher extends Base implements SignalWatcherInterface {
    static [signalWatcherBrand]: true;

    private __watcher?: Signal.subtle.Watcher;

    private __watch() {
      if (this.__watcher !== undefined) {
        return;
      }
      // We create a fresh computed instead of just re-using the existing one
      // because of https://github.com/proposal-signals/signal-polyfill/issues/27
      this.__performUpdateSignal = new Signal.Computed(() => {
        this.__forceUpdateSignal.get();
        super.performUpdate();
      });
      const watcher = (this.__watcher = new Signal.subtle.Watcher(function (
        this: Signal.subtle.Watcher
      ) {
        // All top-level references in this function body must either be `this`
        // (the watcher) or a module global to prevent this closure from keeping
        // the enclosing scopes alive, which would keep the element alive. So
        // The only two references are `this` and `elementForWatcher`.
        const el = elementForWatcher.get(this);
        if (el === undefined) {
          // The element was garbage collected, so we can stop watching.
          return;
        }
        if (el.__forcingUpdate === false) {
          el.requestUpdate();
        }
        this.watch();
      }));
      elementForWatcher.set(watcher, this as unknown as SignalWatcherInternal);
      elementFinalizationRegistry.register(this, {
        watcher,
        signal: this.__performUpdateSignal,
      });
      watcher.watch(this.__performUpdateSignal);
    }

    private __unwatch() {
      if (this.__watcher === undefined) {
        return;
      }
      this.__watcher.unwatch(this.__performUpdateSignal!);
      this.__performUpdateSignal = undefined;
      this.__watcher = undefined;
    }

    /**
     * Used to force an uncached read of the __performUpdateSignal when we need
     * to read the current value during an update.
     *
     * If https://github.com/tc39/proposal-signals/issues/151 is resolved, we
     * won't need this.
     */
    private __forceUpdateSignal = new Signal.State(0);

    /*
     * This field is used within the watcher to determine if the watcher
     * notification was triggered by our performUpdate() override. Because we
     * force a fresh read of the __performUpdateSignal by changing value of the
     * __forceUpdate signal, the watcher will be notified. But we're already
     * performing an update, so we don't want to enqueue another one.
     */
    // @ts-expect-error This field is accessed in a watcher function with a
    // different `this` context, so TypeScript can't see the access.
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
      if (!this.isUpdatePending) {
        // super.performUpdate() performs this check, so we bail early so that
        // we don't read the __performUpdateSignal when it's not going to access
        // any signals. This keeps the last signals read as the sources so that
        // we'll get notified of changes to them.
        return;
      }
      // Always enable watching before an update, even if disconnected, so that
      // we can track signals that are accessed during the update.
      this.__watch();
      // Force an uncached read of __performUpdateSignal
      this.__forcingUpdate = true;
      this.__forceUpdateSignal.set(this.__forceUpdateSignal.get() + 1);
      this.__forcingUpdate = false;
      // Always read from the signal to ensure that it's tracked
      this.__performUpdateSignal!.get();
    }

    protected override update(
      changedProperties: PropertyValueMap<this> | Map<PropertyKey, unknown>
    ): void {
      // We need a try block because both super.update() and
      // WatchDirective.commit() can throw, and we need to ensure that post-
      // update cleanup happens.
      try {
        if (this.__doFullRender) {
          // Force future updates to not perform full renders by default.
          this.__doFullRender = false;
          super.update(changedProperties);
        } else {
          // For a partial render, just commit the pending watches.
          // TODO (justinfagnani): Should we access each signal in a separate
          // try block?
          this.__pendingWatches.forEach((d) => d.commit());
        }
      } finally {
        // If we didn't call super.update(), we need to set this to false
        this.isUpdatePending = false;
        this.__pendingWatches.clear();
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
      super.connectedCallback();
      // Because we might have missed some signal updates while disconnected,
      // we force a full render on the next update.
      this.requestUpdate();
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      // Clean up the watcher earlier than the FinalizationRegistry will, to
      // avoid memory pressure from signals holding references to the element
      // via the watcher.
      //
      // This means that while disconnected, regular reactive property updates
      // will trigger a re-render, but signal updates will not. To ensure that
      // current signal usage is still correctly tracked, we re-enable watching
      // in performUpdate() even while disconnected. From that point on, a
      // disconnected element will be retained by the signals it accesses during
      // the update lifecycle.
      //
      // We use queueMicrotask() to ensure that this cleanup does not happen
      // because of moves in the DOM within the same task, such as removing an
      // element with .remove() and then adding it back later with .append()
      // in the same task. For example, repeat() works this way.
      queueMicrotask(() => {
        if (this.isConnected === false) {
          this.__unwatch();
        }
      });
    }

    /**
     * Enqueues an update caused by a signal change observed by a watch()
     * directive.
     *
     * Note: the method is not part of the public API and is subject to change.
     * In particular, it may be removed if the watch() directive is updated to
     * work with standalone lit-html templates.
     *
     * @internal
     */
    _updateWatchDirective(d: WatchDirective<unknown>): void {
      this.__pendingWatches.add(d);
      // requestUpdate() will set __doFullRender to true, so remember the
      // current value and restore it after calling requestUpdate().
      const shouldRender = this.__doFullRender;
      this.requestUpdate();
      this.__doFullRender = shouldRender;
    }

    /**
     * Clears a watch() directive from the set of pending watches.
     *
     * Note: the method is not part of the public API and is subject to change.
     *
     * @internal
     */
    _clearWatchDirective(d: WatchDirective<unknown>): void {
      this.__pendingWatches.delete(d);
    }
  }
  return SignalWatcher;
}
