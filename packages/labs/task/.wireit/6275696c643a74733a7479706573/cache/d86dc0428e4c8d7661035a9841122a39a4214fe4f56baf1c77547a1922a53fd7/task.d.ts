import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';
export declare type TaskFunction<D extends [...unknown[]], R = any> = (
  args: D
) => R | typeof initialState | Promise<R | typeof initialState>;
export declare type ArgsFunction<D extends [...unknown[]]> = () => D;
export {ArgsFunction as DepsFunction};
/**
 * States for task status
 */
export declare const TaskStatus: {
  readonly INITIAL: 0;
  readonly PENDING: 1;
  readonly COMPLETE: 2;
  readonly ERROR: 3;
};
/**
 * A special value that can be returned from task functions to reset the task
 * status to INITIAL.
 */
export declare const initialState: unique symbol;
export declare type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];
export declare type StatusRenderer<R> = {
  initial?: () => unknown;
  pending?: () => unknown;
  complete?: (value: R) => unknown;
  error?: (error: unknown) => unknown;
};
export interface TaskConfig<T extends unknown[], R> {
  task: TaskFunction<T, R>;
  args?: ArgsFunction<T>;
  autoRun?: boolean;
}
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
export declare class Task<T extends [...unknown[]] = any, R = any> {
  private _previousArgs?;
  private _task;
  private _getArgs?;
  private _callId;
  private _host;
  private _value?;
  private _error?;
  status: TaskStatus;
  /**
   * A Promise that resolve when the current task run is complete.
   *
   * If a new task run is started while a previous run is pending, the Promise
   * is kept and only resolved when the new run is completed.
   */
  taskComplete: Promise<R>;
  /**
   * Controls if they task will run when its arguments change. Defaults to true.
   */
  autoRun: boolean;
  private _resolveTaskComplete;
  private _rejectTaskComplete;
  constructor(
    host: ReactiveControllerHost,
    task: TaskFunction<T, R>,
    args?: ArgsFunction<T>
  );
  constructor(host: ReactiveControllerHost, task: TaskConfig<T, R>);
  hostUpdated(): void;
  protected performTask(): Promise<void>;
  /**
   * Determines if the task should run when it's triggered as part of the
   * host's reactive lifecycle. Note, this is not checked when `run` is
   * explicitly called. A task runs automatically when `autoRun` is `true` and
   * either its arguments change.
   * @param args The task's arguments
   * @returns
   */
  protected shouldRun(args?: T): boolean;
  /**
   * A task runs when its arguments change, as long as the `autoRun` option
   * has not been set to false. To explicitly run a task outside of these
   * conditions, call `run`. A custom set of arguments can optionally be passed
   * and if not given, the configured arguments are used.
   * @param args optional set of arguments to use for this task run
   */
  run(args?: T): Promise<void>;
  get value(): R | undefined;
  get error(): unknown;
  render(renderer: StatusRenderer<R>): unknown;
  private _argsDirty;
}
//# sourceMappingURL=task.d.ts.map
