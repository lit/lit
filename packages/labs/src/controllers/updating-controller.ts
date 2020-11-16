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

import {UpdatingElement} from 'updating-element';
import {
  UpdatingMixin,
  PropertyDeclaration,
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
    const callbacks = {
      connectedCallback: this.connectedCallback
        ? () => this.connectedCallback!()
        : undefined,
      disconnectedCallback: this.disconnectedCallback
        ? () => this.disconnectedCallback!()
        : undefined,
      willUpdate: this.willUpdate
        ? () => this.willUpdate!(this._changedProperties)
        : undefined,
      update: this.update
        ? () => this.update!(this._changedProperties)
        : undefined,
      // Note, `didUpdate` is required since it resets `changedProperties`.
      didUpdate: () => {
        const changedProperties = this._changedProperties;
        this._resolveUpdate();
        this.didUpdate?.(changedProperties);
      },
    };
    host.addController(callbacks);
  }

  _propertyChanged(
    name: PropertyKey,
    oldValue: unknown,
    _options: PropertyDeclaration
  ) {
    if (!this._changedProperties.has(name)) {
      this._changedProperties.set(name, oldValue);
    }
    // When the property changes, provoke an update on the host.
    this.host.requestUpdate();
  }

  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ) {
    return name !== undefined
      ? super.requestUpdate(name, oldValue, options)
      : // if no property is given, still provoke a host update.
        this.host.requestUpdate();
  }
}
