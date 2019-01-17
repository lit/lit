/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// Set Symbol.asyncIterator on browsers without it
if (typeof Symbol !== undefined && Symbol.asyncIterator === undefined) {
  Object.defineProperty(Symbol, 'asyncIterator', {value: Symbol()});
}

/**
 * An async iterable that can have values pushed into it for testing code
 * that consumes async iterables. This iterable can only be safely consumed
 * by one listener.
 */
export class TestAsyncIterable<T> implements AsyncIterable<T> {
  /**
   * A Promise that resolves with the next value to be returned by the
   * async iterable returned from iterable()
   */
  private _nextValue: Promise<T> =
      new Promise((resolve, _) => this._resolveNextValue = resolve);
  private _resolveNextValue!: (value: T) => void;

  async * [Symbol.asyncIterator]() {
    while (true) {
      yield await this._nextValue;
    }
  }

  /**
   * Pushes a new value and returns a Promise that resolves when the value
   * has been emitted by the iterator. push() must not be called before
   * a previous call has completed, so always await a push() call.
   */
  async push(value: T): Promise<void> {
    const currentValue = this._nextValue;
    const currentResolveValue = this._resolveNextValue;
    this._nextValue =
        new Promise((resolve, _) => this._resolveNextValue = resolve);
    // Resolves the previous value of _nextValue (now currentValue in this
    // scope), making `yield await this._nextValue` go.
    currentResolveValue(value);
    // Waits for the value to be emitted
    await currentValue;
    // Need to wait for one more microtask for value to be rendered, but only
    // when devtools is closed. Waiting for rAF might be more reliable, but
    // this waits the minimum that seems reliable now.
    await Promise.resolve();
  }
}
