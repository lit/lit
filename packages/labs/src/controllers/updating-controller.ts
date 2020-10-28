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

import {UpdatingElement, PropertyValues} from 'updating-element';
import {
  addConnectedCallback,
  addDisconnectedCallback,
  addUpdateCallback,
  addUpdatedCallback,
  removeConnectedCallback,
  removeDisconnectedCallback,
  removeUpdateCallback,
  removeUpdatedCallback,
} from '../callbacks/callbacks.js';

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

  // Note, these are not private so they can be used with mixins.
  // @internal
  _boundConnectedCallback = () => this._connectedCallback();
  // @internal
  _boundDisconnectedCallback = () => this._disconnectedCallback();
  // @internal
  _boundWillUpdate = (changedProperties: PropertyValues) =>
    this._willUpdate(changedProperties);
  // @internal
  _boundAfterUpdate = (changedProperties: PropertyValues) =>
    this._afterUpdate(changedProperties);

  constructor(host: UpdatingHost) {
    this.addController(this, host);
  }

  addController(controller: UpdatingController, host: UpdatingHost) {
    if (controller.host) {
      throw new Error('A controller must be removed before being added.');
    }
    controller.host = host;
    const hostIsElement = (host as UpdatingElement).localName !== undefined;
    controller.element = hostIsElement
      ? (host as UpdatingElement)
      : (host as UpdatingController).element;
    addConnectedCallback(
      host as UpdatingElement,
      controller._boundConnectedCallback
    );
    addDisconnectedCallback(
      host as UpdatingElement,
      controller._boundDisconnectedCallback
    );
    addUpdateCallback(host as UpdatingElement, controller._boundWillUpdate);
    addUpdatedCallback(host as UpdatingElement, controller._boundAfterUpdate);
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
    removeConnectedCallback(
      host as UpdatingElement,
      controller._boundConnectedCallback
    );
    removeDisconnectedCallback(
      host as UpdatingElement,
      controller._boundDisconnectedCallback
    );
    removeUpdateCallback(host as UpdatingElement, controller._boundWillUpdate);
    removeUpdatedCallback(
      host as UpdatingElement,
      controller._boundAfterUpdate
    );
    controller.element = undefined;
    controller.host = undefined;
  }

  requestUpdate() {
    this.host?.requestUpdate();
  }

  // Note, these are patchable entry points for adding callbacks.
  _connectedCallback() {
    this.onConnected();
  }
  _disconnectedCallback() {
    this.onDisconnected();
  }
  _willUpdate(changedProperties: PropertyValues) {
    this.onUpdate(changedProperties);
  }
  _afterUpdate(changedProperties: PropertyValues) {
    this.onUpdated(changedProperties);
  }

  /**
   * Runs when the controller's element updates, before the element itself
   * updates.
   * @param changedProperties
   */
  onUpdate(_changedProperties: PropertyValues) {}

  /**
   * Runs after the controller's element updates after its `updated` method.
   * @param changedProperties
   */
  onUpdated(_changedProperties: PropertyValues) {}

  /**
   * Runs after the controller's element is connected.
   */
  onConnected() {}

  /**
   * Runs after the controller's element is disconnected.
   */
  onDisconnected() {}
}
