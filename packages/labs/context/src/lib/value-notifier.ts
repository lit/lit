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

/**
 * A tuple of context callback, and its disposer
 */
type CallbackRecord<T> = [ContextCallback<T>, Disposer];

/**
 * A simple class which stores a value, and triggers registered callbacks when the
 * value is changed via its setter.
 *
 * An implementor might use other observable patterns such as MobX or Redux to get
 * behavior like this. But this is a pretty minimal approach that will likely work
 * for a number of use cases.
 */
export class ValueNotifier<T> {
  private callbacks: Set<CallbackRecord<T>> = new Set();

  private _value!: T;
  public get value(): T {
    return this._value;
  }
  public set value(v: T) {
    this.setValue(v);
  }

  public setValue(v: T, force = false) {
    let changed = false;
    if (!Object.is(v, this._value)) {
      changed = true;
    }
    this._value = v;
    if (changed || force) {
      this.updateObservers();
    }
  }

  constructor(defaultValue?: T) {
    if (defaultValue !== undefined) {
      this.value = defaultValue;
    }
  }

  updateObservers = (): void => {
    this.callbacks.forEach(([callback, disposer]) =>
      callback(this._value, disposer)
    );
  };

  addCallback(callback: ContextCallback<T>, subscribe?: boolean): void {
    if (subscribe) {
      const record: CallbackRecord<T> = [
        callback,
        () => {
          this.callbacks.delete(record);
        },
      ];
      this.callbacks.add(record);
    }
    callback(this.value);
  }

  clearCallbacks(): void {
    this.callbacks.clear();
  }
}
