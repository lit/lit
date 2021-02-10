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
import {
  LitElement,
  ReactiveController,
  ReactiveControllerHost,
} from 'lit-element';
import {
  Loader,
  ElementDependencies,
  Orchestrator,
  LazyModule,
} from './orchestrator.js';

export * from './action.js';
export * from 'lit-element';
export * from './orchestrator.js';

interface LazyControllerConstructor<T extends ReactiveController> {
  new (host: ReactiveControllerHost): T;
}

export class LazyElement<T extends ReactiveController> extends LitElement {
  static dependencies: Loader;

  static elementDependencies: ElementDependencies;

  static orchestrator: Orchestrator;

  lazyController?: T;

  constructor() {
    super();
    const ctor = this.constructor as typeof LazyElement;
    if (ctor.orchestrator !== undefined) {
      ctor.orchestrator.load(ctor.dependencies);
    }
  }

  isBootstrapping = false;

  private _bootstrapResolver!: (value: boolean) => void;

  private _bootstrapPromise: Promise<boolean> = new Promise(
    (r) => (this._bootstrapResolver = r)
  );

  get isBootstrapped() {
    return Boolean(this.lazyController);
  }

  async bootstrap() {
    if (this.lazyController === undefined) {
      this.isBootstrapping = true;
      const {Controller} = (await (this
        .constructor as typeof LazyElement).dependencies?.()) as LazyModule;
      if (Controller !== undefined) {
        this.lazyController = new (Controller as LazyControllerConstructor<T>)(
          this
        );
      }
      this.isBootstrapping = false;
      this._bootstrapResolver(true);
    }
  }

  bootstrapComplete() {
    return this._bootstrapPromise;
  }

  async getUpdateComplete() {
    if (this.isBootstrapping) {
      await this.bootstrapComplete();
    }
    return super.getUpdateComplete();
  }
}
