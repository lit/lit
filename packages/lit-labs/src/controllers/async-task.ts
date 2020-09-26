import {
  UpdatingController,
  UpdatingHost,
} from '../updating-controller.js';
import {notEqual} from 'lit-element';

export type TaskFunction = (...args: Array<any>) => any;
export type Deps = Array<any>;
export type DepsFunction = () => Deps;

export class AsyncTask extends UpdatingController {
  private _previousDeps: Deps = [];
  isPending = false;
  key = 0;

  constructor(
    host: UpdatingHost,
    public task: TaskFunction,
    public depsCallback: DepsFunction,
    public value = null
  ) {
    super(host);
  }

  onUpdate() {
    this.performTask();
  }

  onUpdated() {
    this.performTask();
  }

  async performTask() {
    const deps = this.depsCallback();
    if (this.depsDirty(deps)) {
      this.isPending = true;
      const key = ++this.key;
      const value = await this.task(...deps);
      // If this is the most recent task call, process this value.
      if (this.key === key && this.host) {
        this.value = value;
        this.isPending = false;
        this.requestUpdate();
      }
    }
  }

  depsDirty(deps: Deps) {
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
