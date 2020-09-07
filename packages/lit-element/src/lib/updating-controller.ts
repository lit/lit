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

import {UpdatingElement, PropertyValues} from './updating-element';

/**
 * Use this module if you want to create your own base class extending
 * [[UpdatingController]].
 * @packageDocumentation
 */

/**
 * Base controller class which can interact with an UpdatingElemrnt by hooking
 * into its lifecycle. The controller can perform tasks when it associated
 * element is connected or disconnected by implementing the `onConnected` and
 * `onDisconnected` methods. It can prompt the element to update by calling
 * `requestUpdating`, and it can perform tasks as the element updates by
 * implementing `onUpdate` and `onUpdated`. Controllers can contain other
 * controllers. Controllers have an `element` property which is the element
 * to which the controller is attached and a `host` property which is either
 * an element or another controller.
 * @noInheritDoc
 */
export class UpdatingController {
  controllers: Set<UpdatingController> = new Set();
  element: UpdatingElement;

  constructor(public host: UpdatingController | UpdatingElement) {
    this.element =
      this.host instanceof UpdatingElement
        ? (this.host as UpdatingElement)
        : (this.host as UpdatingController).element;
    this._ensureElementSupportsControllers();
    (this.host.controllers as Set<UpdatingController>).add(this);
  }

  /**
   * Installs controller support into the controller's element. This is done
   * lazily by the controller to minimize the amount of code needed in
   * UpdatingElement.
   */
  private _ensureElementSupportsControllers() {
    const element = this.element;
    if ((element as any)._supportsUpdatingControllers) {
      return;
    }
    const controller = this;
    Object.assign(element, {
      _supportsUpdatingControllers: true,
      controllers: new Set(),
      onConnected() {
        controller.runControllers(element.onConnected, arguments, element);
      },
      onDisconnected() {
        controller.runControllers(element.onDisconnected, arguments, element);
      },
      onUpdate(_changedProperties: PropertyValues) {
        controller.runControllers(element.onUpdate, arguments, element);
      },
      onUpdated(_changedProperties: PropertyValues) {
        controller.runControllers(element.onUpdated, arguments, element);
      },
    });
  }

  requestUpdate() {
    this.host.requestUpdate();
  }

  /**
   * Runs the given method on the set of controllers managed by this controller
   * or its element.
   * @param method
   * @param args
   * @param context
   */
  runControllers(
    method: Function,
    args: IArguments = arguments,
    context: UpdatingElement | UpdatingController = this
  ) {
    for (const controller of context.controllers!) {
      const fn = (controller as UpdatingController)[
        method.name as keyof UpdatingController
      ] as Function;
      if (fn) {
        fn.call(controller, ...args);
      }
    }
  }

  /**
   * Runs when the controller's element updates, before the element itself
   * updates.
   * @param _changedProperties
   */
  onUpdate(_changedProperties: PropertyValues) {
    this.runControllers(this.onUpdate, arguments);
  }

  /**
   * Runs after the controller's element updates after its `updated` method.
   * @param _changedProperties
   */
  onUpdated(_changedProperties: PropertyValues) {
    this.runControllers(this.onUpdated, arguments);
  }

  /**
   * Runs after the controller's element is connected.
   */
  onConnected() {
    this.runControllers(this.onConnected);
  }

  /**
   * Runs after the controller's element is disconnected.
   */
  onDisconnected() {
    this.runControllers(this.onDisconnected);
  }
}
