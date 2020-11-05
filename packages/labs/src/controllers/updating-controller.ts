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

import {UpdatingElement, PropertyValues, Controller} from 'updating-element';

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
export class UpdatingController implements Controller {
  /**
   * UpdatingElement to which this controller is connected.
   */
  host: UpdatingElement;

  constructor(host: UpdatingElement) {
    this.host = host;
    host.addController(this);
  }

  requestUpdate() {
    this.host.requestUpdate();
  }

  /**
   * Runs after the controller's element is connected.
   */
  connectedCallback() {}

  /**
   * Runs after the controller's element is disconnected.
   */
  disconnectedCallback() {}

  /**
   * Runs when the controller's element updates, before the element itself
   * updates.
   * @param changedProperties
   */
  willUpdate(_changedProperties: PropertyValues) {}

  /**
   * Runs when the controller's element updates, when the element itself
   * updates.
   * @param changedProperties
   */
  update(_changedProperties: PropertyValues) {}

  /**
   * Runs after the controller's element updates after its `updated` method.
   * @param changedProperties
   */
  updated(_changedProperties: PropertyValues) {}
}
