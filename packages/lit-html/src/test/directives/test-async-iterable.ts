/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
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
  private _nextValue: Promise<T> = new Promise(
    (resolve) => (this._resolveNextValue = resolve)
  );
  private _resolveNextValue!: (value: T) => void;

  async *[Symbol.asyncIterator]() {
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
    this._nextValue = new Promise(
      (resolve) => (this._resolveNextValue = resolve)
    );
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
