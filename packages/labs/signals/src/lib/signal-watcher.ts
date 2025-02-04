/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ReactiveElement} from 'lit';
import {Signal} from 'signal-polyfill';

export interface SignalWatcher extends ReactiveElement {
  _partUpdateWatcher?: Signal.subtle.Watcher;
}

interface SignalWatcherApi {
  effect(
    fn: () => void,
    options?: {beforeUpdate?: boolean; manualDispose?: boolean}
  ): () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}> = new (...args: any[]) => T;

interface SignalWatcherInterface extends SignalWatcher {}
interface SignalWatcherInternal extends SignalWatcher {
  __forcingUpdate: boolean;
  __beforeUpdateWatcher?: Signal.subtle.Watcher;
  __performUpdateWatcher?: Signal.subtle.Watcher;
  __afterUpdateWatcher?: Signal.subtle.Watcher;
  __flushEffects: () => void;
  __queueEffects: () => void;
}

const signalWatcherBrand: unique symbol = Symbol('SignalWatcherBrand');

// Memory management: We need to ensure that we don't leak memory by creating a
// reference cycle between an element and its watcher, which then it kept alive
// by the signals it watches. To avoid this, we break the cycle by using a
// WeakMap to store the watcher for each element, and a FinalizationRegistry to
// clean up the watcher when the element is garbage collected.

const elementFinalizationRegistry = new FinalizationRegistry<{
  beforeUpdateWatcher: Signal.subtle.Watcher;
  performUpdateWatcher: Signal.subtle.Watcher;
  partUpdateWatcher: Signal.subtle.Watcher;
  afterUpdateWatcher: Signal.subtle.Watcher;
}>(
  ({
    beforeUpdateWatcher,
    performUpdateWatcher,
    partUpdateWatcher,
    afterUpdateWatcher,
  }) => {
    beforeUpdateWatcher.unwatch(
      ...Signal.subtle.introspectSources(beforeUpdateWatcher)
    );
    performUpdateWatcher.unwatch(
      ...Signal.subtle.introspectSources(performUpdateWatcher)
    );
    partUpdateWatcher.unwatch(
      ...Signal.subtle.introspectSources(partUpdateWatcher)
    );
    afterUpdateWatcher.unwatch(
      ...Signal.subtle.introspectSources(afterUpdateWatcher)
    );
  }
);

const elementForWatcher = new WeakMap<
  Signal.subtle.Watcher,
  SignalWatcherInternal
>();

/**
 * Adds the ability for a LitElement or other ReactiveElement class to
 * watch for access to signals during the update lifecycle and trigger a new
 * update when signals values change.
 */
export function SignalWatcher<T extends Constructor<ReactiveElement>>(Base: T) {
  // Only apply the mixin once
  if ((Base as typeof SignalWatcher)[signalWatcherBrand] === true) {
    console.warn(
      'SignalWatcher should not be applied to the same class more than once.'
    );
    return Base as T & Constructor<SignalWatcherApi>;
  }

  class SignalWatcher extends Base implements SignalWatcherInterface {
    static [signalWatcherBrand]: true;

    // @internal
    _partUpdateWatcher?: Signal.subtle.Watcher;
    private __performUpdateWatcher?: Signal.subtle.Watcher;
    private __beforeUpdateWatcher?: Signal.subtle.Watcher;
    private __afterUpdateWatcher?: Signal.subtle.Watcher;

    private __flushWatcher(watcher: Signal.subtle.Watcher | undefined) {
      if (watcher === undefined) {
        return;
      }
      for (const signal of watcher.getPending()) {
        signal.get();
      }
      watcher.watch();
    }

    private __flushEffects() {
      this.__flushWatcher(this.__beforeUpdateWatcher!);
      this.__flushWatcher(this._partUpdateWatcher!);
      this.__flushWatcher(this.__performUpdateWatcher!);
      this.__flushWatcher(this.__afterUpdateWatcher!);
    }

    // @ts-expect-error This method is called anonymously in a watcher function
    private __queueEffects() {
      if (this.isUpdatePending) {
        return;
      }
      queueMicrotask(() => {
        if (!this.isUpdatePending) {
          this.__flushEffects();
        }
      });
    }

    private __watch() {
      if (this.__performUpdateWatcher !== undefined) {
        return;
      }
      // We create a fresh computed instead of just re-using the existing one
      // because of https://github.com/proposal-signals/signal-polyfill/issues/27
      this.__performUpdateSignal = new Signal.Computed(() => {
        this.__forceUpdateSignal.get();
        super.performUpdate();
      });
      const performUpdateWatcher = (this.__performUpdateWatcher =
        new Signal.subtle.Watcher(function (this: Signal.subtle.Watcher) {
          // All top-level references in this function body must either be `this`
          // (the performUpdateWatcher) or a module global to prevent this closure from keeping
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
      const watchCb = async function (this: Signal.subtle.Watcher) {
        const el = elementForWatcher.get(performUpdateWatcher);
        if (el === undefined) {
          // The element was garbage collected, so we can stop watching.
          return;
        }
        this.watch();
        el.__queueEffects();
      };
      const beforeUpdateWatcher = (this.__beforeUpdateWatcher =
        new Signal.subtle.Watcher(watchCb));
      const partUpdateWatcher = (this._partUpdateWatcher =
        new Signal.subtle.Watcher(watchCb));
      const afterUpdateWatcher = (this.__afterUpdateWatcher =
        new Signal.subtle.Watcher(watchCb));
      elementForWatcher.set(
        performUpdateWatcher,
        this as unknown as SignalWatcherInternal
      );
      elementFinalizationRegistry.register(this, {
        beforeUpdateWatcher,
        partUpdateWatcher,
        performUpdateWatcher,
        afterUpdateWatcher,
      });
      performUpdateWatcher.watch(this.__performUpdateSignal);
      beforeUpdateWatcher.watch(...Array.from(this.#effects.before));
      afterUpdateWatcher.watch(...Array.from(this.#effects.after));
    }

    private __unwatch() {
      if (this.__performUpdateWatcher === undefined) {
        return;
      }
      this.__performUpdateWatcher?.unwatch(
        ...Signal.subtle.introspectSources(this.__performUpdateWatcher!)
      );
      this.__beforeUpdateWatcher?.unwatch(...Array.from(this.#effects.before));
      this.__afterUpdateWatcher?.unwatch(...Array.from(this.#effects.after));
      this.__performUpdateSignal = undefined;
      this.__beforeUpdateWatcher = undefined;
      this._partUpdateWatcher = undefined;
      this.__performUpdateWatcher = undefined;
      this.__afterUpdateWatcher = undefined;
    }

    #effects = {
      before: new Set<Signal.Computed<void>>(),
      after: new Set<Signal.Computed<void>>(),
    };

    effect(
      fn: () => void,
      options?: {beforeUpdate?: boolean; manualDispose?: boolean}
    ): () => void {
      this.__watch();
      const signal = new Signal.Computed(() => {
        fn();
      });
      const beforeUpdate = options?.beforeUpdate ?? false;
      const watcher = beforeUpdate
        ? this.__beforeUpdateWatcher
        : this.__afterUpdateWatcher;
      watcher!.watch(signal);
      const effectList = beforeUpdate
        ? this.#effects.before
        : this.#effects.after;
      if (options?.manualDispose !== true) {
        effectList.add(signal);
      }
      // An untracked read is safer and all that it takes to
      // tell the watcher to go.
      if (beforeUpdate) {
        Signal.subtle.untrack(() => signal.get());
      } else {
        this.updateComplete.then(() =>
          Signal.subtle.untrack(() => signal.get())
        );
      }
      return () => {
        effectList.delete(signal);
        watcher!.unwatch(signal);
      };
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
      // Flush all queued effects...
      this.__flushEffects();
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
  }

  return SignalWatcher as T & Constructor<SignalWatcherApi>;
}
