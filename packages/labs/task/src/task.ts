/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {notEqual} from '@lit/reactive-element';
import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskFunction<D extends [...unknown[]], R = any> = (
  args: D
) => R | typeof initialState | Promise<R | typeof initialState>;
export type ArgsFunction<D extends [...unknown[]]> = () => D;

export type CanRunFunction = (
  canRun: () => boolean,
  status: TaskStatus,
  args?: unknown[]
) => boolean;

/**
 * States for task status
 */
export const TaskStatus = {
  INITIAL: 0,
  PENDING: 1,
  COMPLETE: 2,
  ERROR: 3,
} as const;

/**
 * A special value that can be returned from task functions to reset the task
 * status to INITIAL.
 */
export const initialState = Symbol();

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export type StatusRenderer<R> = {
  initial?: () => unknown;
  pending?: () => unknown;
  complete?: (value: R) => unknown;
  error?: (error: unknown) => unknown;
};

export interface TaskConfig<T extends unknown[], R> {
  task: TaskFunction<T, R>;
  args?: ArgsFunction<T>;
  canRun?: CanRunFunction;
}

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
 * be customized by passing a `canRun` function. It receives arguments of
 * a default `canRun()` function, the task's status, and the values of the
 * task's arguments.
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
export class Task<T extends [...unknown[]] = any, R = any> {
  private _previousArgs: T = [] as unknown as T;
  private _task: TaskFunction<T, R>;
  private _args: ArgsFunction<T>;
  private _callId = 0;
  private _host: ReactiveControllerHost;
  private _value?: R;
  private _error?: unknown;
  // Internal signal for being fully done processing a task, including host updates.
  private _isIdle = true;
  status: TaskStatus = TaskStatus.INITIAL;

  /**
   * A Promise that resolve when the current task run is complete.
   *
   * If a new task run is started while a previous run is pending, the Promise
   * is kept and only resolved when the new run is completed.
   */
  taskComplete!: Promise<R>;
  private _resolveTaskComplete!: (value: R) => void;
  private _rejectTaskComplete!: (e: unknown) => void;

  constructor(
    host: ReactiveControllerHost,
    task: TaskFunction<T, R> | TaskConfig<T, R>,
    args?: ArgsFunction<T>
  ) {
    this._host = host;
    this._host.addController(this);
    if (typeof task === 'object') {
      const taskConfig = task as TaskConfig<T, R>;
      args = taskConfig.args;
      task = taskConfig.task;
      if (taskConfig.canRun !== undefined) {
        this._canRun = taskConfig.canRun;
      }
    }
    this._task = task;
    this._args = args || (((_x: unknown) => []) as unknown as ArgsFunction<T>);
    this.taskComplete = new Promise((res, rej) => {
      this._resolveTaskComplete = res;
      this._rejectTaskComplete = rej;
    });
  }

  hostUpdated() {
    this.runTask();
  }

  protected async runTask() {
    const args = this._args();
    const argsDirty = this._argsDirty(args);
    const canRun = () => this.defaultCanRun(argsDirty, args);
    if (this._canRun(canRun, this.status, args)) {
      this._isIdle = false;
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
      let result!: R | typeof initialState;
      let error: unknown;
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
            this._resolveTaskComplete(result as R);
          } else {
            this.status = TaskStatus.ERROR;
            this._rejectTaskComplete(error);
          }
          this._value = result as R;
          this._error = error;
        }
        // Request an update with the final value.
        this._host.requestUpdate();
        await this._host.updateComplete;
        this._isIdle = true;
      }
    }
  }

  get value() {
    return this._value;
  }

  get error() {
    return this._error;
  }

  render(renderer: StatusRenderer<R>) {
    switch (this.status) {
      case TaskStatus.INITIAL:
        return renderer.initial?.();
      case TaskStatus.PENDING:
        return renderer.pending?.();
      case TaskStatus.COMPLETE:
        return renderer.complete?.(this.value!);
      case TaskStatus.ERROR:
        return renderer.error?.(this.error);
      default:
        // exhaustiveness check
        this.status as void;
    }
  }

  private _argsDirty(args: T) {
    let i = 0;
    const previousArgs = this._previousArgs;
    this._previousArgs = args;
    for (const arg of args) {
      if (notEqual(arg, previousArgs[i])) {
        return true;
      }
      i++;
    }
    return false;
  }

  protected defaultCanRun(argsDirty: boolean, args: T) {
    return (
      argsDirty ||
      (!args.length && this.status !== TaskStatus.PENDING && this._isIdle)
    );
  }

  private _canRun(canRun: () => boolean, _status: TaskStatus, _args: T) {
    return canRun();
  }
}
