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

import {PropertyValues} from 'updating-element';

export type updateCallback = (changedProperties: PropertyValues) => void;
export type connectCallback = () => void;

interface UpdatingHost {
  _connectedCallback(): void;
  _disconnectedCallback(): void;
  _willUpdate(changedProperties: PropertyValues): void;
  _didUpdate(changedProperties: PropertyValues): void;
}

// connectedCallback
const connectedCallbacks: WeakMap<
  UpdatingHost,
  Set<connectCallback>
> = new WeakMap();
const getConnectedCallbacks = (host: UpdatingHost) => {
  let callbacks = connectedCallbacks.get(host);
  if (callbacks === undefined) {
    const base = host._connectedCallback;
    host._connectedCallback = function () {
      // TODO(sorvell): Using `.call` is marginally slower than installing the
      // base method on the object, but this needs to be measured in a real
      // benchmark. The downside of installing on the object is the potential
      // for name collision and/or the need to reserve an un-mangled name.
      base.call(this);
      callbacks!.forEach((callback: connectCallback) => callback());
    };
    connectedCallbacks.set(host, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds a connectedCallback callback to the given host.
 */
export const addConnectedCallback = (
  host: UpdatingHost,
  callback: connectCallback
) => {
  getConnectedCallbacks(host).add(callback);
};

/**
 * Removes a connectedCallback callback from the given host.
 */
export const removeConnectedCallback = (
  host: UpdatingHost,
  callback: connectCallback
) => {
  getConnectedCallbacks(host).delete(callback);
};

// disconnectedCallback
const disconnectedCallbacks: WeakMap<
  UpdatingHost,
  Set<connectCallback>
> = new WeakMap();
const getDisconnectedCallbacks = (host: UpdatingHost) => {
  let callbacks = disconnectedCallbacks.get(host);
  if (callbacks === undefined) {
    const base = host._disconnectedCallback;
    host._disconnectedCallback = function () {
      base.call(this);
      callbacks!.forEach((callback: connectCallback) => callback());
    };
    disconnectedCallbacks.set(host, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds a disconnectedCallback callback to the given host.
 */
export const addDisconnectedCallback = (
  host: UpdatingHost,
  callback: connectCallback
) => {
  getDisconnectedCallbacks(host).add(callback);
};

/**
 * Removes a disconnectedCallback callback from the given host.
 */
export const removeDisconnectedCallback = (
  host: UpdatingHost,
  callback: connectCallback
) => {
  getDisconnectedCallbacks(host).delete(callback);
};

// updateCallback
const updateCallbacks: WeakMap<
  UpdatingHost,
  Set<updateCallback>
> = new WeakMap();
const getUpdateCallbacks = (host: UpdatingHost) => {
  let callbacks = updateCallbacks.get(host);
  if (callbacks === undefined) {
    const base = host._willUpdate;
    host._willUpdate = function (changedProperties: PropertyValues) {
      callbacks!.forEach((callback: updateCallback) =>
        callback(changedProperties)
      );
      base.call(this, changedProperties);
    };
    updateCallbacks.set(host, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds an updateCallback callback to the given host.
 */
export const addUpdateCallback = (
  host: UpdatingHost,
  callback: updateCallback
) => {
  getUpdateCallbacks(host).add(callback);
};

/**
 * Removes an updateCallback callback from the given host.
 */
export const removeUpdateCallback = (
  host: UpdatingHost,
  callback: updateCallback
) => {
  getUpdateCallbacks(host).delete(callback);
};

// updatedCallback
const updatedCallbacks: WeakMap<
  UpdatingHost,
  Set<updateCallback>
> = new WeakMap();
const getUpdatedCallbacks = (host: UpdatingHost) => {
  let callbacks = updatedCallbacks.get(host);
  if (callbacks === undefined) {
    const base = host._didUpdate;
    host._didUpdate = function (changedProperties: PropertyValues) {
      base.call(this, changedProperties);
      callbacks!.forEach((callback: updateCallback) =>
        callback(changedProperties)
      );
    };
    updatedCallbacks.set(host, (callbacks = new Set()));
  }
  return callbacks;
};

/**
 * Adds an updatedCallback callback to the given host.
 */
export const addUpdatedCallback = (
  host: UpdatingHost,
  callback: updateCallback
) => {
  getUpdatedCallbacks(host).add(callback);
};

/**
 * Removes an updatedCallback callback from the given host.
 */
export const removeUpdatedCallback = (
  host: UpdatingHost,
  callback: updateCallback
) => {
  getUpdatedCallbacks(host).delete(callback);
};
