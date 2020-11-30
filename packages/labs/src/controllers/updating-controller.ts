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

import {UpdatingElement, Controller} from 'updating-element';
import {
  UpdatingMixin,
  PropertyValues,
} from 'updating-element/updating-mixin.js';
export {
  PropertyDeclaration,
  PropertyDeclarations,
} from 'updating-element/updating-mixin.js';

/**
 * Use this module if you want to create your own base class extending
 * [[UpdatingController]].
 * @packageDocumentation
 */

/**
 * Base controller class which can interact with an UpdatingElement by hooking
 * into its lifecycle. The controller can perform tasks when its associated
 * element is connected or disconnected by implementing the `onConnected` and
 * `onDisconnected` methods. It can prompt the element to update by calling
 * `requestUpdate`, and it can perform tasks as the element updates by
 * implementing `onUpdate` and `onUpdated`. Controllers can contain other
 * controllers. Controllers have an `element` property which is the element
 * to which the controller is attached and a `host` property which is either
 * an element or another controller.
 * @noInheritDoc
 */

const UpdatingBase = UpdatingMixin(class {});

export class UpdatingController extends UpdatingBase {
  /**
   * UpdatingElement to which this controller is connected.
   */
  host: UpdatingElement;

  constructor(host: UpdatingElement) {
    super();
    (this.constructor as typeof UpdatingController).finalize();
    this.host = host;
    host.addController((this as unknown) as Controller);
  }

  protected _scheduleUpdate() {
    this.host.requestUpdate();
  }

  protected update() {
    this.handleChanges(this._changedProperties);
    this._resolveUpdate();
  }

  /**
   * Implement to compute properties based on changes in other properties.
   * Can return a set of properties that become the return value of `getProps`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleChanges(_changedProperties: PropertyValues): any {}

  /**
   * Implement to return properties that should be used in rendering.
   */
  takeChanges(callback?: () => void) {
    if (callback !== undefined) {
      callback();
    }
    return this.handleChanges(this._changedProperties);
  }
}
