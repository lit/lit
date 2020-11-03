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
  Controller,
  ControllerHost,
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
export class UpdatingController implements Controller {
  host?: ControllerHost;

  /**
   * Root UpdatingElement to which this controller is connected.
   */
  element?: UpdatingElement;

  // @internal
  _controllers?: Controller[];

  constructor(host: UpdatingHost) {
    host.addController(this);
  }

  addController(controller: Controller) {
    (this._controllers ??= []).push(controller);
    // Allows controller to be added after element is connected.
    if (this.element?.hasUpdated && this.element?.isConnected) {
      controller.onConnected?.(this);
    }
  }

  removeController(controller: Controller) {
    if (!controller.host) {
      return;
    }
    // Allows controller to perform cleanup tasks before removal.
    controller.onDisconnected?.(this);
    controller.element = undefined;
    this._controllers = this._controllers?.filter((c) => c !== controller);
  }

  requestUpdate() {
    this.host?.requestUpdate?.();
  }

  /**
   * Runs after the controller's element is connected.
   */
  onConnected(host: ControllerHost) {
    this.host = host;
    this.element ??= (host as UpdatingElement).localName
      ? (host as UpdatingElement)
      : (host as UpdatingController).element;
    this._controllers?.forEach((c) => c.onConnected?.(this));
  }

  /**
   * Runs after the controller's element is disconnected.
   */
  onDisconnected(_host: ControllerHost) {
    this._controllers?.forEach((c) => c.onDisconnected?.(this));
    this.host = undefined;
    this.element = undefined;
  }

  /**
   * Runs when the controller's element updates, before the element itself
   * updates.
   * @param changedProperties
   */
  onUpdate(changedProperties: PropertyValues, _host: ControllerHost) {
    this._controllers?.forEach((c) => c.onUpdate?.(changedProperties, this));
  }

  /**
   * Runs after the controller's element updates after its `updated` method.
   * @param changedProperties
   */
  onUpdated(changedProperties: PropertyValues, _host: ControllerHost) {
    this._controllers?.forEach((c) => c.onUpdated?.(changedProperties, this));
  }
}
