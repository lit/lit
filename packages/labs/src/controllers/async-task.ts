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
import {ReactiveElement, notEqual} from 'reactive-element';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskFunction = (...args: Array<any>) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Deps = Array<any>;
export type DepsFunction = () => Deps;

/**
 * States for task status
 */
export const TaskStatus = {
  INITIAL: 0,
  PENDING: 1,
  COMPLETE: 2,
  ERROR: 3,
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export type StatusRenderer = {
  initial?: () => unknown;
  pending?: () => unknown;
  complete?: (value: unknown) => unknown;
  error?: (error: unknown) => unknown;
};

// TODO(sorvell): Some issues:
// 1. When task is triggered in `updated`, this generates a ReactiveElement
// warning that the update was triggered in response to an update.
// 2. And as a result of triggering in `updated`, if the user waits for the
// `updateComplete` promise they will not see a `pending` state since this
// will be triggered in another update; they would need to
// `while (!(await el.updateComplete));`.
// 3. If this is instead or additionally triggered in `willUpdate`, the
// warning goes away in the common case that the update itself does not change
// the deps; however, the `requestUpdate` to render pending state  will not
// trigger another update since the element is updating. This `requestUpdate`
// could be triggered in updated, but that results in the same issue as #2.
// 4. There is no good signal for when the task has resolved and rendered other
// than requestAnimationFrame. The user would need to store a promise for the
// task and then wait for that and the element to update.

/**
 * A controller that performs an asynchronous task like a fetch when its host
 * element updates. The controller then performs an update on the host element
 * when the task completes. The task function must be supplied and can take a
 * list of dependencies. The `value` can be initially set and is updated with
 * the result of the task when it's complete. The `isPending` property can be
 * read to determine the task's state, and the `completeTask()` promise
 * resolves when the task completes. Here's an example:
 *
 * class MyElement extends ReactiveElement {
 *   url = 'example.com/api';
 *   id = 0;
 *   task = new AsyncTask(
 *     this,
 *     (url, id) =>
 *       fetch(`${this.url}?id=${this.id}`).then(response => response.json()),
 *     () => [this.id, this.url],
 *     'initial value'
 *   );
 *
 *   update(changedProperties) {
 *     super.update(changedProperties);
 *     if (this.task.isPending) {
 *       console.log('task pending');
 *     } else {
 *       console.log('task value', this.task.value);
 *     }
 *   }
 * }
 */
export class AsyncTask {
  private _previousDeps: Deps = [];
  private _task: TaskFunction;
  private _getDependencies: DepsFunction;
  private _callId = 0;
  private _host: ReactiveElement;
  private _value?: unknown;
  private _error?: unknown;
  status: TaskStatus = TaskStatus.INITIAL;

  constructor(
    host: ReactiveElement,
    task: TaskFunction,
    getDependencies: DepsFunction
  ) {
    this._host = host;
    this._host.addController(this);
    this._task = task;
    this._getDependencies = getDependencies;
  }

  updated() {
    this._completeTask();
  }

  private async _completeTask() {
    const deps = this._getDependencies();
    if (this._isDirty(deps)) {
      this.status = TaskStatus.PENDING;
      this._error = undefined;
      this._value = undefined;
      let value: unknown;
      let error: unknown;
      // Request an update to report pending state.
      this._host.requestUpdate();
      const key = ++this._callId;
      try {
        value = await this._task(deps);
      } catch (e) {
        error = e;
      }
      // If this is the most recent task call, process this value.
      if (this._callId === key) {
        this.status =
          error === undefined ? TaskStatus.COMPLETE : TaskStatus.ERROR;
        this._value = value;
        this._error = error;
        // Request an update with the final value.
        this._host.requestUpdate();
      }
    }
  }

  get value() {
    return this._value;
  }

  get error() {
    return this._error;
  }

  render(renderer: StatusRenderer) {
    switch (this.status) {
      case TaskStatus.INITIAL:
        return renderer.initial?.();
      case TaskStatus.PENDING:
        return renderer.pending?.();
      case TaskStatus.COMPLETE:
        return renderer.complete?.(this.value);
      case TaskStatus.ERROR:
        return renderer.error?.(this.error);
    }
  }

  private _isDirty(deps: Deps) {
    let i = 0;
    const previousDeps = this._previousDeps;
    this._previousDeps = deps;
    for (const dep of deps) {
      if (notEqual(dep, previousDeps[i])) {
        return true;
      }
      i++;
    }
    return false;
  }
}
