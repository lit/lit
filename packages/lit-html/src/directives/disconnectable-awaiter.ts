/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {AsyncDirective} from '../async-directive.js';

const unresolved = Symbol();

/**
 * Helper class for awaiting promises from AsyncDirectives such that the `then`
 * function bound to the directive is weakly held by the promise, so that if
 * the directive disconnects, it is possible for it to be garbage collected
 * before the awaited promise resolves. If the promise resolves while
 * disconnected, the result is retained such that a reconnection will trigger
 * the `then` function.
 */
export class DisconnectableAwaiter<
  DirectiveType extends AsyncDirective,
  ResultType = unknown,
  RejectType = unknown
> {
  private _directive: DirectiveType | undefined;
  private _thenFn: (directive: DirectiveType, value: ResultType) => void;
  private _catchFn?: (directive: DirectiveType, reason: RejectType) => void;
  private _result: ResultType | typeof unresolved = unresolved;
  private _error: RejectType | typeof unresolved = unresolved;
  /**
   * @param promise The promise to await
   * @param directive The AsyncDirective to call the `thenFn` function on
   * @param thenFn The `then` function to call once the promise resolves with the resolved value
   * @param extraArgs Any additional arguments to pass to the `thenFn` function
   */
  constructor(
    promise: Promise<ResultType>,
    directive: DirectiveType,
    thenFn: (directive: DirectiveType, value: ResultType) => void,
    catchFn?: (directive: DirectiveType, reason: RejectType) => void
  ) {
    // Note that if the directive is not connected when the promise is initially
    // awaited, do not associte it with the promise, but still await it so that
    // we can flush the result if/when the promise is reconnected to the
    // directive. This is a small value-add that is easy to forget.
    if (directive.isConnected) {
      this._directive = directive;
    }
    this._thenFn = thenFn;
    promise.then((result: ResultType) => {
      if (this._directive !== undefined) {
        thenFn(this._directive, result);
      } else {
        this._result = result;
      }
    });
    if (catchFn !== undefined) {
      this._catchFn = catchFn;
      promise.catch((reason: RejectType) => {
        if (this._directive !== undefined) {
          catchFn(this._directive, reason);
        } else {
          this._error = reason;
        }
      });
    }
  }
  /**
   * Call to (possibly temporarily) disassociate the promise from the directive
   */
  disconnect() {
    this._directive = undefined;
  }
  /**
   * Call to re-associate the promise to the directive
   * @param directive
   */
  reconnect(directive: DirectiveType) {
    const {_result, _error} = this;
    if (_result !== unresolved) {
      this._result = unresolved;
      this._thenFn(directive, _result);
    } else if (_error !== unresolved) {
      this._error = unresolved;
      this._catchFn?.(directive, _error);
    } else {
      this._directive = directive;
    }
  }
}
