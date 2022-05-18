/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {notEqual} from '@lit/reactive-element';
/**
 * States for task status
 */
export const TaskStatus = {
  INITIAL: 0,
  PENDING: 1,
  COMPLETE: 2,
  ERROR: 3,
};
/**
 * A special value that can be returned from task functions to reset the task
 * status to INITIAL.
 */
export const initialState = Symbol();
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
 * element updates. The controller performs an update on the host element
 * when the task becomes pending and when it completes. The task function must
 * be supplied and can take a list of dependencies specified as a function that
 * returns a list of values. The `value` property reports the completed value,
 * and the `error` property an error state if one occurs. The `status` property
 * can be checked for status and is of type `TaskStatus` which has states for
 * initial, pending, complete, and error. The `render` method accepts an
 * object with optional corresponding state method to easily render values
 * corresponding to the task state.
 *
 * The task is run automatically when its arguments change; however, this can
 * be customized by setting `autoRun` to false and calling `run` explicitly
 * to run the task.
 *
 * class MyElement extends ReactiveElement {
 *   url = 'example.com/api';
 *   id = 0;
 *   task = new Task(
 *     this, {
 *       task: ([url, id]) =>
 *         fetch(`${this.url}?id=${this.id}`).then(response => response.json()),
 *       args: () => [this.id, this.url]
 *     }
 *   );
 *
 *   update(changedProperties) {
 *     super.update(changedProperties);
 *     this.task.render({
 *       pending: () => console.log('task pending'),
 *       complete: (value) => console.log('task value', value);
 *     });
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Task {
  constructor(host, task, args) {
    this._callId = 0;
    this.status = TaskStatus.INITIAL;
    /**
     * Controls if they task will run when its arguments change. Defaults to true.
     */
    this.autoRun = true;
    this._host = host;
    this._host.addController(this);
    const taskConfig = typeof task === 'object' ? task : {task, args};
    this._task = taskConfig.task;
    this._getArgs = taskConfig.args;
    if (taskConfig.autoRun !== undefined) {
      this.autoRun = taskConfig.autoRun;
    }
    this.taskComplete = new Promise((res, rej) => {
      this._resolveTaskComplete = res;
      this._rejectTaskComplete = rej;
    });
  }
  hostUpdated() {
    this.performTask();
  }
  async performTask() {
    var _a;
    const args =
      (_a = this._getArgs) === null || _a === void 0 ? void 0 : _a.call(this);
    if (this.shouldRun(args)) {
      this.run(args);
    }
  }
  /**
   * Determines if the task should run when it's triggered as part of the
   * host's reactive lifecycle. Note, this is not checked when `run` is
   * explicitly called. A task runs automatically when `autoRun` is `true` and
   * either its arguments change.
   * @param args The task's arguments
   * @returns
   */
  shouldRun(args) {
    return this.autoRun && this._argsDirty(args);
  }
  /**
   * A task runs when its arguments change, as long as the `autoRun` option
   * has not been set to false. To explicitly run a task outside of these
   * conditions, call `run`. A custom set of arguments can optionally be passed
   * and if not given, the configured arguments are used.
   * @param args optional set of arguments to use for this task run
   */
  async run(args) {
    var _a;
    args !== null && args !== void 0
      ? args
      : (args =
          (_a = this._getArgs) === null || _a === void 0
            ? void 0
            : _a.call(this));
    if (
      this.status === TaskStatus.COMPLETE ||
      this.status === TaskStatus.ERROR
    ) {
      this.taskComplete = new Promise((res, rej) => {
        this._resolveTaskComplete = res;
        this._rejectTaskComplete = rej;
      });
    }
    this.status = TaskStatus.PENDING;
    this._error = undefined;
    this._value = undefined;
    let result;
    let error;
    // Request an update to report pending state.
    this._host.requestUpdate();
    const key = ++this._callId;
    try {
      result = await this._task(args);
    } catch (e) {
      error = e;
    }
    // If this is the most recent task call, process this value.
    if (this._callId === key) {
      if (result === initialState) {
        this.status = TaskStatus.INITIAL;
      } else {
        if (error === undefined) {
          this.status = TaskStatus.COMPLETE;
          this._resolveTaskComplete(result);
        } else {
          this.status = TaskStatus.ERROR;
          this._rejectTaskComplete(error);
        }
        this._value = result;
        this._error = error;
      }
      // Request an update with the final value.
      this._host.requestUpdate();
    }
  }
  get value() {
    return this._value;
  }
  get error() {
    return this._error;
  }
  render(renderer) {
    var _a, _b, _c, _d;
    switch (this.status) {
      case TaskStatus.INITIAL:
        return (_a = renderer.initial) === null || _a === void 0
          ? void 0
          : _a.call(renderer);
      case TaskStatus.PENDING:
        return (_b = renderer.pending) === null || _b === void 0
          ? void 0
          : _b.call(renderer);
      case TaskStatus.COMPLETE:
        return (_c = renderer.complete) === null || _c === void 0
          ? void 0
          : _c.call(renderer, this.value);
      case TaskStatus.ERROR:
        return (_d = renderer.error) === null || _d === void 0
          ? void 0
          : _d.call(renderer, this.error);
      default:
        // exhaustiveness check
        this.status;
    }
  }
  _argsDirty(args) {
    const prev = this._previousArgs;
    this._previousArgs = args;
    return Array.isArray(args) && Array.isArray(prev)
      ? args.length === prev.length && args.some((v, i) => notEqual(v, prev[i]))
      : args !== prev;
  }
}
//# sourceMappingURL=task.js.map
