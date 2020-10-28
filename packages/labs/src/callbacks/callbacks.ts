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

export type updateCallback = (changedProperties: PropertyValues) => void;
export type connectCallback = () => void;

// connectedCallback
const connectedCallbacks: WeakMap<
  UpdatingElement,
  Set<connectCallback>
> = new WeakMap();
const getConnectedCallbacks = (element: UpdatingElement) => {
  let callbacks = connectedCallbacks.get(element);
  if (callbacks === undefined) {
    const base = element._connectedCallback;
    element._connectedCallback = function () {
      // TODO(sorvell): Using `.call` is marginally slower than installing the
      // base method on the object, but this needs to be measured in a real
      // benchmark. The downside of installing on the object is the potential
      // for name collision and/or the need to reserve an unmangled name.
      base.call(this);
      callbacks!.forEach((callback: connectCallback) => callback());
    };
    connectedCallbacks.set(element, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds a connectedCallback callback to the given element.
 */
export const addConnectedCallback = (
  element: UpdatingElement,
  callback: connectCallback
) => {
  getConnectedCallbacks(element).add(callback);
};

/**
 * Removes a connectedCallback callback from the given element.
 */
export const removeConnectedCallback = (
  element: UpdatingElement,
  callback: connectCallback
) => {
  getConnectedCallbacks(element).delete(callback);
};

// disconnectedCallback
const disconnectedCallbacks: WeakMap<
  UpdatingElement,
  Set<connectCallback>
> = new WeakMap();
const getDisconnectedCallbacks = (element: UpdatingElement) => {
  let callbacks = disconnectedCallbacks.get(element);
  if (callbacks === undefined) {
    const base = element._disconnectedCallback;
    element._disconnectedCallback = function () {
      base.call(this);
      callbacks!.forEach((callback: connectCallback) => callback());
    };
    disconnectedCallbacks.set(element, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds a disconnectedCallback callback to the given element.
 */
export const addDisconnectedCallback = (
  element: UpdatingElement,
  callback: connectCallback
) => {
  getDisconnectedCallbacks(element).add(callback);
};

/**
 * Removes a disconnectedCallback callback from the given element.
 */
export const removeDisconnectedCallback = (
  element: UpdatingElement,
  callback: connectCallback
) => {
  getDisconnectedCallbacks(element).delete(callback);
};

// updateCallback
const updateCallbacks: WeakMap<
  UpdatingElement,
  Set<updateCallback>
> = new WeakMap();
const getUpdateCallbacks = (element: UpdatingElement) => {
  let callbacks = updateCallbacks.get(element);
  if (callbacks === undefined) {
    const base = element._willUpdate;
    element._willUpdate = function (changedProperties: PropertyValues) {
      callbacks!.forEach((callback: updateCallback) =>
        callback(changedProperties)
      );
      base.call(this, changedProperties);
    };
    updateCallbacks.set(element, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds an updateCallback callback to the given element.
 */
export const addUpdateCallback = (
  element: UpdatingElement,
  callback: updateCallback
) => {
  getUpdateCallbacks(element).add(callback);
};

/**
 * Removes an updateCallback callback from the given element.
 */
export const removeUpdateCallback = (
  element: UpdatingElement,
  callback: updateCallback
) => {
  getUpdateCallbacks(element).delete(callback);
};

// updatedCallback
const updatedCallbacks: WeakMap<
  UpdatingElement,
  Set<updateCallback>
> = new WeakMap();
const getUpdatedCallbacks = (element: UpdatingElement) => {
  let callbacks = updatedCallbacks.get(element);
  if (callbacks === undefined) {
    const base = element._afterUpdate;
    element._afterUpdate = function (changedProperties: PropertyValues) {
      base.call(this, changedProperties);
      callbacks!.forEach((callback: updateCallback) =>
        callback(changedProperties)
      );
    };
    updatedCallbacks.set(element, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds an updatedCallback callback to the given element.
 */
export const addUpdatedCallback = (
  element: UpdatingElement,
  callback: updateCallback
) => {
  getUpdatedCallbacks(element).add(callback);
};

/**
 * Removes an updatedCallback callback from the given element.
 */
export const removeUpdatedCallback = (
  element: UpdatingElement,
  callback: updateCallback
) => {
  getUpdatedCallbacks(element).delete(callback);
};
