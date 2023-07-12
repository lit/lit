/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextCallback} from './context-request-event.js';

/**
 * A disposer function
 */
type Disposer = () => void;

interface CallbackInfo {
  disposer: Disposer;
  consumerHost?: Element;
}

export interface MovedSubscription<T> {
  callback: ContextCallback<T>;
  consumerHost: Element;
}

/**
 * A simple class which stores a value, and triggers registered callbacks when the
 * value is changed via its setter.
 *
 * An implementor might use other observable patterns such as MobX or Redux to get
 * behavior like this. But this is a pretty minimal approach that will likely work
 * for a number of use cases.
 */
export class ValueNotifier<T> {
  private callbacks: Map<ContextCallback<T>, CallbackInfo> = new Map();

  private _value!: T;
  public get value(): T {
    return this._value;
  }
  public set value(v: T) {
    this.setValue(v);
  }

  public setValue(v: T, force = false) {
    const update = force || !Object.is(v, this._value);
    this._value = v;
    if (update) {
      this.updateObservers();
    }
  }

  constructor(defaultValue?: T) {
    if (defaultValue !== undefined) {
      this.value = defaultValue;
    }
  }

  updateObservers = (): void => {
    for (const [callback, {disposer}] of this.callbacks) {
      callback(this._value, disposer);
    }
  };

  addCallback(
    callback: ContextCallback<T>,
    subscribe?: boolean,
    consumerHost?: Element
  ): void {
    if (subscribe) {
      if (!this.callbacks.has(callback)) {
        this.callbacks.set(callback, {
          disposer: () => {
            this.callbacks.delete(callback);
          },
          consumerHost,
        });
      }
      const {disposer} = this.callbacks.get(callback)!;
      callback(this.value, disposer);
    } else {
      callback(this.value);
    }
  }

  clearCallbacks(): void {
    this.callbacks.clear();
  }

  /**
   * Handle a late registration of an provider in between us and any consumers
   * that we have ongoing subscriptions with.
   *
   * childProviderHost must be a provider host of T which is a descendent of
   * our host. So we look through our active subscriptions, and if any of them
   * are contained inside of childProviderHost, we stop handling them ourselves
   * and we return them in an array so that the childProviderHost can handle
   * them from now on.
   */
  moveSubscriptionsFor(
    childProviderHost: Element
  ): undefined | MovedSubscription<T>[] {
    let result: undefined | MovedSubscription<T>[] = undefined;
    for (const [callback, {consumerHost}] of this.callbacks) {
      if (consumerHost === undefined) {
        continue;
      }
      if (
        childProviderHost !== consumerHost &&
        childProviderHost.contains(consumerHost)
      ) {
        this.callbacks.delete(callback);
        if (result === undefined) {
          result = [];
        }
        result.push({callback, consumerHost});
      }
    }
    return result;
  }
}
