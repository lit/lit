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

import {UpdatingController} from './updating-controller.js';
import {UpdatingElement, notEqual} from 'updating-element';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskFunction = (...args: Array<any>) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Deps = Array<any>;
export type DepsFunction = () => Deps;

/**
 * A controller that performs an asynchronous task like a fetch and performs
 * an update on the host element when the task completes. The task
 * function must be supplied and can take a list of dependencies. The `value`
 * can be initially set and is updated with the result of the task when it's
 * complete. The `isPending` property can be read to determine the task's
 * state, and the `taskComplete` promise resolves when the task completes.
 * Here's an example:
 *
 * class MyElement extends UpdatingElement {
 *   url = 'example.com/api';
 *   id = 0;
 *   task = new AsyncTask(
 *     this,
 *     (url, id) =>
 *       fetch(`${this.url}?id=${this.id}`).then(response => response.json()),
 *     () => [this.id, this.url],
 *     'initial value'
 *   );
 * }
 */
export class AsyncTask extends UpdatingController {
  private _previousDeps: Deps = [];
  isPending = false;
  key = 0;

  constructor(
    host: UpdatingElement,
    private _task: TaskFunction,
    private _dependencies: DepsFunction,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public value: any = null
  ) {
    super(host);
  }

  protected async handleChanges() {
    const deps = this._dependencies();
    if (this._isDirty(deps)) {
      this.isPending = true;
      const key = ++this.key;
      const value = await this._task(...deps);
      // If this is the most recent task call, process this value.
      if (this.key === key) {
        this.value = value;
        this.isPending = false;
        // Request an update with the final value.
        this.requestUpdate();
      }
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

  get taskComplete() {
    return async () => await this.handleChanges();
  }
}
