/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive, AsyncDirective} from '../async-directive.js';
import {ElementPart} from '../directive.js';

// HTMLElement patch

let upgradingElement: Element | undefined = undefined;
const patchedHTMLElement = function HTMLElement(this: HTMLElement) {
  return upgradingElement || this;
};
patchedHTMLElement.prototype = HTMLElement.prototype;
Object.defineProperty(HTMLElement.prototype, 'constructor', {
  writable: true,
  configurable: true,
  enumerable: false,
  value: patchedHTMLElement,
});
Object.defineProperty(window, 'HTMLElement', {
  writable: true,
  configurable: true,
  enumerable: false,
  value: patchedHTMLElement,
});

declare class CustomHTMLElement extends HTMLElement {
  connectedCallback?: () => void;
  disconnectedCallback?: () => void;
  attributeChangedCallback?: (
    name: string,
    old: string | null,
    value: string | null
  ) => void;
  static observedAttributes?: string[];
}

// Registry

const {setAttribute, removeAttribute} = HTMLElement.prototype;

class CustomElementRegistry {
  private _definitions = new Map<string, typeof CustomHTMLElement>();
  private _pendingUpgradeQueue = new Map<string, Set<HTMLElement>>();
  private _upgradedElements = new WeakSet<CustomHTMLElement>();

  define(tagName: string, ctor: typeof CustomHTMLElement) {
    this._definitions.set(tagName, ctor);
    const observedAttributes = ctor.observedAttributes;
    if (observedAttributes && ctor.prototype.attributeChangedCallback) {
      const observed = new Set(observedAttributes);
      ctor.prototype.setAttribute = function (name: string, value: string) {
        const isObserved = observed.has(name);
        const old = isObserved ? this.getAttribute(name) : null;
        setAttribute.call(this, name, value);
        if (isObserved) {
          ctor.prototype.attributeChangedCallback!(name, old, value);
        }
      };
      ctor.prototype.removeAttribute = function (name: string) {
        const isObserved = observed.has(name);
        const old = isObserved ? this.getAttribute(name) : null;
        removeAttribute.call(this, name);
        if (isObserved) {
          ctor.prototype.attributeChangedCallback!(name, old, null);
        }
      };
    }
    const queue = this._pendingUpgradeQueue.get(tagName);
    if (queue !== undefined) {
      for (const element of queue) {
        this._ensureUpgraded(element);
      }
      this._pendingUpgradeQueue.delete(tagName);
    }
  }

  get(name: string) {
    return this._definitions.get(name);
  }

  _ensureUpgraded(element: CustomHTMLElement) {
    if (!this._upgradedElements.has(element)) {
      const tagName = element.localName;
      const ctor = customElements.get(tagName) as typeof CustomHTMLElement;
      if (ctor === undefined) {
        let queue = this._pendingUpgradeQueue.get(tagName);
        if (queue === undefined) {
          this._pendingUpgradeQueue.set(tagName, (queue = new Set()));
        }
        queue.add(element);
      } else {
        upgradingElement = element;
        Object.setPrototypeOf(upgradingElement, ctor.prototype);
        new ctor();
        upgradingElement = undefined;
        const observedAttributes = ctor.observedAttributes;
        if (
          observedAttributes &&
          element.attributeChangedCallback !== undefined
        ) {
          for (const name of observedAttributes) {
            const value = element.getAttribute(name);
            if (value !== null) {
              element.attributeChangedCallback(name, null, value);
            }
          }
        }
        element.connectedCallback?.();
        this._upgradedElements.add(element);
      }
    }
  }

  _connect(element: CustomHTMLElement) {
    if (this._upgradedElements.has(element)) {
      element.connectedCallback?.();
    } else {
      this._pendingUpgradeQueue.get(element.localName)!.add(element);
    }
  }

  _disconnect(element: CustomHTMLElement) {
    if (this._upgradedElements.has(element)) {
      element.disconnectedCallback?.();
    } else {
      this._pendingUpgradeQueue.get(element.localName)!.delete(element);
    }
  }
}

Object.defineProperty(window, 'CustomElementRegistry', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: CustomElementRegistry,
});

Object.defineProperty(window, 'customElements', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: new CustomElementRegistry(),
});

const customElements =
  window.customElements as unknown as CustomElementRegistry;

// Directive

class UpgradeDirective extends AsyncDirective {
  private element!: CustomHTMLElement;

  render() {}

  override update({element}: ElementPart) {
    this.element = element as CustomHTMLElement;
    customElements._ensureUpgraded(this.element);
  }

  override disconnected() {
    customElements._disconnect(this.element);
  }

  override reconnected() {
    customElements._connect(this.element);
  }
}

/**
 * When placed in element position on a custom element, upgrades that element
 * and manages its custom element lifecycle. For use on browsers without custom
 * element support as a lightweight polyfill option.
 */
export const upgrade = directive(UpgradeDirective);
