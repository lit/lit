/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ReactiveElement} from 'lit';
import {Signal} from 'signal-polyfill';

export interface SignalWatcher extends ReactiveElement {
  _watcher?: Signal.subtle.Watcher;
}

interface EffectOptions {
  /**
   * By default effects run after the element has updated. If `beforeUpdate`
   * is set to `true`, the effect will run before the element updates.
   */
  beforeUpdate?: boolean;
  /**
   * By default, effects are automatically disposed when the element is
   * disconnected. If `manualDispose` is set to `true`, the effect will not
   * be automatically disposed, and you must call the returned function to
   * dispose of the effect manually.
   */
  manualDispose?: boolean;
}

export interface ElementEffectOptions extends EffectOptions {
  element?: SignalWatcher & SignalWatcherApi;
}

let effectsPending = false;
const effectWatcher = new Signal.subtle.Watcher(() => {
  if (effectsPending) {
    return;
  }
  effectsPending = true;
  queueMicrotask(() => {
    effectsPending = false;
    for (const signal of effectWatcher.getPending()) {
      signal.get();
    }
    effectWatcher.watch();
  });
});

interface SignalWatcherApi {
  updateEffect(fn: () => void, options?: EffectOptions): () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}> = new (...args: any[]) => T;

interface SignalWatcherInterface extends SignalWatcher {}
interface SignalWatcherInternal extends SignalWatcher {
  __forcingUpdate: boolean;
  __performUpdateSignal?: Signal.Computed<void>;
  requestUpdate(): void;
  __queueEffects: () => void;
}

const signalWatcherBrand: unique symbol = Symbol('SignalWatcherBrand');

// Memory management: We need to ensure that we don't leak memory by creating a
// reference cycle between an element and its watcher, which then it kept alive
// by the signals it watches. To avoid this, we break the cycle by using a
// WeakMap to store the watcher for each element, and a FinalizationRegistry to
// clean up the watcher when the element is garbage collected.
const elementFinalizationRegistry =
  new FinalizationRegistry<Signal.subtle.Watcher>((watcher) => {
    watcher.unwatch(...Signal.subtle.introspectSources(watcher));
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

    // @internal used in watch directive
    _watcher?: Signal.subtle.Watcher;

    /**
     * Flushes effects in required order:
     * 1. Before update effects
     * 2. Perform update
     * 3. Pending watches
     * 4. After update effects
     * */
    private __flushEffects() {
      const beforeEffects = [] as Signal.Computed<void>[];
      const afterEffects = [] as Signal.Computed<void>[];
      this.__effects.forEach((options, signal) => {
        const list = options?.beforeUpdate ? beforeEffects : afterEffects;
        list.push(signal);
      });
      const pendingWatches = this._watcher
        ?.getPending()
        .filter(
          (signal) =>
            signal !== this.__performUpdateSignal && !this.__effects.has(signal)
        );
      beforeEffects.forEach((signal) => signal.get());
      this.__performUpdateSignal?.get();
      pendingWatches!.forEach((signal) => signal.get());
      afterEffects.forEach((signal) => signal.get());
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
      if (this._watcher !== undefined) {
        return;
      }
      // We create a fresh computed instead of just re-using the existing one
      // because of https://github.com/proposal-signals/signal-polyfill/issues/27
      this.__performUpdateSignal = new Signal.Computed(() => {
        this.__forceUpdateSignal.get();
        super.performUpdate();
      });
      const watcher = (this._watcher = new Signal.subtle.Watcher(function (
        this: Signal.subtle.Watcher
      ) {
        // All top-level references in this function body must either be `this`
        // (the `watcher`) or a module global to prevent this closure from keeping
        // the enclosing scopes alive, which would keep the element alive. So
        // The only two references are `this` and `elementForWatcher`.
        const el = elementForWatcher.get(this);
        if (el === undefined) {
          // The element was garbage collected, so we can stop watching.
          return;
        }
        if (el.__forcingUpdate === false) {
          const needsUpdate = new Set(this.getPending()).has(
            el.__performUpdateSignal as Signal.Computed<void>
          );
          if (needsUpdate) {
            el.requestUpdate();
          } else {
            el.__queueEffects();
          }
        }
        this.watch();
      }));
      elementForWatcher.set(watcher, this as unknown as SignalWatcherInternal);
      elementFinalizationRegistry.register(this, watcher);
      watcher.watch(this.__performUpdateSignal);
      watcher.watch(...Array.from(this.__effects).map(([signal]) => signal));
    }

    private __unwatch() {
      if (this._watcher === undefined) {
        return;
      }
      let keepAlive = false;
      // We unwatch all signals that are not manually disposed, so that we don't
      // keep the element alive by holding references to it.
      this._watcher.unwatch(
        ...Signal.subtle.introspectSources(this._watcher!).filter((signal) => {
          const shouldUnwatch =
            this.__effects.get(signal as Signal.Computed<void>)
              ?.manualDispose !== true;
          if (shouldUnwatch) {
            this.__effects.delete(signal as Signal.Computed<void>);
          }
          keepAlive ||= !shouldUnwatch;
          return shouldUnwatch;
        })
      );
      if (!keepAlive) {
        this.__performUpdateSignal = undefined;
        this._watcher = undefined;
        this.__effects.clear();
      }
    }

    // list signals managing effects, stored with effect options.
    private __effects = new Map<
      Signal.Computed<void>,
      EffectOptions | undefined
    >();

    /**
     * Executes the provided callback function when any of the signals it
     * accesses change. By default, the function is called after any pending
     * element update. Set the `beforeUpdate` property to `true` to run the
     * effect before the element updates. An effect is automatically disposed
     * when the element is disconnected. Set the `manualDispose` property to
     * `true` to prevent this. Call the returned function to manually dispose
     * of the effect.
     *
     * @param callback
     * @param options {beforeUpdate, manualDispose}
     */
    updateEffect(fn: () => void, options?: EffectOptions): () => void {
      this.__watch();
      const signal = new Signal.Computed(() => {
        fn();
      });
      this._watcher!.watch(signal);
      this.__effects.set(signal, options);
      const beforeUpdate = options?.beforeUpdate ?? false;
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
        this.__effects.delete(signal);
        this._watcher!.unwatch(signal);
        if (this.isConnected === false) {
          this.__unwatch();
        }
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
