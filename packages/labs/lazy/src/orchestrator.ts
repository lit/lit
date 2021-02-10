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
import {ReactiveController, LazyElement} from './lazy-element.js';

export interface LazyModule {
  Controller: ReactiveController;
}

export type LazyImport = Promise<LazyModule>;

export type Loader = () => LazyImport;

export type ElementLoader = () => Promise<unknown>;

export interface ElementDependencies {
  [index: string]: ElementLoader;
}

export class Orchestrator {
  eventRoot = document;

  events = ['click'];

  _loadResolver?: (value: boolean) => void;
  _loadPromise?: Promise<boolean>;

  constructor() {
    this.installListeners();
  }

  elementModules: Map<string, () => Promise<unknown>> = new Map();

  load(loader: Loader) {
    loader();
  }

  installListeners() {
    this.events.forEach((e: string) => {
      this.eventRoot.addEventListener(e, this.listener, true);
    });
  }

  listener = async (e: Event) => {
    // e.preventDefault();
    const path = e.composedPath();
    const first = path[0];
    let needsRefire = false;
    for (let i = 0; i < path.length - 1; i++) {
      const n = path[i] as LazyElement<ReactiveController>;
      if ((n as Node).nodeType === Node.ELEMENT_NODE) {
        const events = n.getAttribute('lazyactions');
        if (events?.includes(e.type)) {
          if (n.isBootstrapped) {
            // This tree has been handled for this event type.
            return;
          } else {
            needsRefire = true;
            if (this._loadPromise === undefined) {
              this._loadPromise = new Promise((r) => (this._loadResolver = r));
            }
            await this.elementModules.get(n.localName)?.();
            await n?.bootstrap();
          }
        }
      }
    }
    this._loadResolver?.(true);
    // Everything is bootstrapped... re-dispatchEvent.
    if (needsRefire) {
      first.dispatchEvent(e);
    }
  };

  loadComplete() {
    return this._loadPromise;
  }
}

export const orchestrator = new Orchestrator();
