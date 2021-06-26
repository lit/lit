/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class Deferred<T> {
  readonly promise: Promise<T>;
  private _resolve!: (value: T) => void;
  private _reject!: (error: Error) => void;
  settled = false;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve(value: T) {
    this.settled = true;
    this._resolve(value);
  }

  reject(error: Error) {
    this.settled = true;
    this._reject(error);
  }
}
