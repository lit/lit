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

import {UpdatingElement, PropertyValues, connectCallback, updateCallback} from './updating-element';

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

  element!: UpdatingElement;
  host!: UpdatingController | UpdatingElement;
  connectedCallbacks: Set<connectCallback> = new Set();
  disconnectedCallbacks: Set<connectCallback> = new Set();
  updateCallbacks: Set<updateCallback> = new Set();
  updatedCallbacks: Set<updateCallback> = new Set();
  private _onConnected: connectCallback;
  private _onDisconnected: connectCallback;
  private _onUpdate: updateCallback;
  private _onUpdated: updateCallback;

  constructor(host: UpdatingController | UpdatingElement) {
    const element =
      host instanceof UpdatingElement
        ? host
        : host.element;
    this._onConnected = () => this.onConnected();
    this._onDisconnected = () => this.onDisconnected();
    this._onUpdate = (changedProperties: PropertyValues) => this.onUpdate(changedProperties);
    this._onUpdated = (changedProperties: PropertyValues) => this.onUpdated(changedProperties);
    this.addController(element, host, this);
  }

  addController(element: UpdatingElement, host: UpdatingController | UpdatingElement, controller: UpdatingController) {
    controller.element = element;
    controller.host = host;
    host.connectedCallbacks.add(controller._onConnected);
    host.disconnectedCallbacks.add(controller._onDisconnected);
    host.updateCallbacks.add(controller._onUpdate);
    host.updatedCallbacks.add(controller._onUpdated);
  }

  removeController(controller: any) {
    const host = controller.host;
    if (!host) {
      return;
    }
    controller.onDisconnected();
    controller.element = undefined;
    controller.host = undefined;
    if (host) {
      host.connectedCallbacks.delete(controller._onConnected);
      host.disconnectedCallbacks.delete(controller._onDisconnected);
      host.updateCallbacks.delete(controller._onUpdate);
      host.updatedCallbacks.delete(controller._onUpdated);
    }
  }

  requestUpdate() {
    this.host.requestUpdate();
  }

  /**
   * Runs when the controller's element updates, before the element itself
   * updates.
   * @param changedProperties
   */
  onUpdate(changedProperties: PropertyValues) {
    this.updateCallbacks.forEach(cb => cb(changedProperties));
  }

  /**
   * Runs after the controller's element updates after its `updated` method.
   * @param changedProperties
   */
  onUpdated(changedProperties: PropertyValues) {
    this.updatedCallbacks.forEach(cb => cb(changedProperties));
  }

  /**
   * Runs after the controller's element is connected.
   */
  onConnected() {
    this.connectedCallbacks.forEach(cb => cb());
  }

  /**
   * Runs after the controller's element is disconnected.
   */
  onDisconnected() {
    this.disconnectedCallbacks.forEach(cb => cb());
  }
}
