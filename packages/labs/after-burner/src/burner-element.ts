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
import {LitElement} from 'lit-element';
import {Loader, ElementDependencies, Orchestrator} from './orchestrator.js';

export * from './directives.js';
export * from 'lit-element';

export class BurnerElement extends LitElement {
  static dependencies: Loader;

  static elementDependencies: ElementDependencies;

  static orchestrator: Orchestrator;

  constructor() {
    super();
    const ctor = this.constructor as typeof BurnerElement;
    if (ctor.orchestrator !== undefined) {
      ctor.orchestrator.load(ctor.dependencies);
    }
  }
}
