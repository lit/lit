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
 * A simple class which stores a value, and triggers registered callbacks when the
 * value is changed via its setter.
 *
 * An implementor might use other observable patterns such as MobX or Redux to get
 * behavior like this. But this is a pretty minimal approach that will likely work
 * for a number of use cases.
 */
export class ValueNotifier<T> {
  private disposers: Map<ContextCallback<T>, Disposer> = new Map();

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
    for (const [callback, disposer] of this.disposers) {
      callback(this._value, disposer);
    }
  };

  addCallback(callback: ContextCallback<T>, subscribe?: boolean): void {
    if (subscribe) {
      if (!this.disposers.has(callback)) {
        this.disposers.set(callback, () => {
          this.disposers.delete(callback);
        });
      }
      const disposer = this.disposers.get(callback)!;
      callback(this.value, disposer);
    } else {
      callback(this.value);
    }
  }

  clearCallbacks(): void {
    this.disposers.clear();
  }
}
