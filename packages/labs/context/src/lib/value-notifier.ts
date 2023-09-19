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
  consumerHost: Element;
}

/**
 * A simple class which stores a value, and triggers registered callbacks when
 * the value is changed via its setter.
 *
 * An implementor might use other observable patterns such as MobX or Redux to
 * get behavior like this. But this is a pretty minimal approach that will
 * likely work for a number of use cases.
 */
export class ValueNotifier<T> {
  protected readonly subscriptions = new Map<
    ContextCallback<T>,
    CallbackInfo
  >();
  private _value!: T;
  get value(): T {
    return this._value;
  }
  set value(v: T) {
    this.setValue(v);
  }

  setValue(v: T, force = false) {
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
    for (const [callback, {disposer}] of this.subscriptions) {
      callback(this._value, disposer);
    }
  };

  addCallback(
    callback: ContextCallback<T>,
    consumerHost: Element,
    subscribe?: boolean
  ): void {
    if (!subscribe) {
      // just call the callback once and we're done
      callback(this.value);
      return;
    }
    if (!this.subscriptions.has(callback)) {
      this.subscriptions.set(callback, {
        disposer: () => {
          this.subscriptions.delete(callback);
        },
        consumerHost,
      });
    }
    const {disposer} = this.subscriptions.get(callback)!;
    callback(this.value, disposer);
  }

  clearCallbacks(): void {
    this.subscriptions.clear();
  }
}
