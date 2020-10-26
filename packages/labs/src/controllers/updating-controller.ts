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
  UpdatingElement,
  PropertyValues,
  connectCallback,
  updateCallback,
} from 'updating-element';

/**
 * Use this module if you want to create your own base class extending
 * [[UpdatingController]].
 * @packageDocumentation
 */

export type UpdatingHost = UpdatingController | UpdatingElement;

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
export class UpdatingController {
  /**
   * Root UpdatingElement to which this controller is connected.
   */
  element?: UpdatingElement;

  /**
   * Hosting controller or element to which this controller is connected.
   */
  host?: UpdatingHost;

  /**
   * Lifecycle callbacks for sub-controllers
   */
  connectedCallbacks: Set<connectCallback> = new Set();
  disconnectedCallbacks: Set<connectCallback> = new Set();
  updateCallbacks: Set<updateCallback> = new Set();
  updatedCallbacks: Set<updateCallback> = new Set();

  // Note, these are not private so they can be used with mixins.
  // @internal
  _onConnected = () => this.onConnected();
  // @internal
  _onDisconnected = () => this.onDisconnected();
  // @internal
  _onUpdate = (changedProperties: PropertyValues) =>
    this.onUpdate(changedProperties);
  // @internal
  _onUpdated = (changedProperties: PropertyValues) =>
    this.onUpdated(changedProperties);

  constructor(host: UpdatingHost) {
    this.addController(this, host);
  }

  addController(controller: UpdatingController, host: UpdatingHost) {
    if (controller.host) {
      throw new Error('A controller must be removed before being added.');
    }
    controller.host = host;
    controller.element =
      (host as UpdatingElement).localName !== undefined
        ? (host as UpdatingElement)
        : (host as UpdatingController).element;
    host.connectedCallbacks.add(controller._onConnected);
    host.disconnectedCallbacks.add(controller._onDisconnected);
    host.updateCallbacks.add(controller._onUpdate);
    host.updatedCallbacks.add(controller._onUpdated);
    // Allows controller to be added after element is connected.
    if (controller.element?.isConnected) {
      controller.onConnected();
    }
  }

  removeController(controller: UpdatingController) {
    if (!controller.host) {
      return;
    }
    // Allows controller to perform cleanup tasks before removal.
    controller.onDisconnected();
    const host = controller.host;
    host.connectedCallbacks.delete(controller._onConnected);
    host.disconnectedCallbacks.delete(controller._onDisconnected);
    host.updateCallbacks.delete(controller._onUpdate);
    host.updatedCallbacks.delete(controller._onUpdated);
    controller.element = undefined;
    controller.host = undefined;
  }

  requestUpdate() {
    this.host?.requestUpdate();
  }

  /**
   * Runs when the controller's element updates, before the element itself
   * updates.
   * @param changedProperties
   */
  onUpdate(changedProperties: PropertyValues) {
    this.updateCallbacks.forEach((cb) => cb(changedProperties));
  }

  /**
   * Runs after the controller's element updates after its `updated` method.
   * @param changedProperties
   */
  onUpdated(changedProperties: PropertyValues) {
    this.updatedCallbacks.forEach((cb) => cb(changedProperties));
  }

  /**
   * Runs after the controller's element is connected.
   */
  onConnected() {
    this.connectedCallbacks.forEach((cb) => cb());
  }

  /**
   * Runs after the controller's element is disconnected.
   */
  onDisconnected() {
    this.disconnectedCallbacks.forEach((cb) => cb());
  }
}
