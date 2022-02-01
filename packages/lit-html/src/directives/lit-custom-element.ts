/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A lightweight custom element implementation as an element directive.
 * Note, this is automatically integrated into the `polyfill-support-lite`
 * module.
 *
 * @packageDocumentation
 */

import {nothing, ElementPart} from '../lit-html.js';
import {directive, AsyncDirective} from '../async-directive.js';
import {ElementPartProcessors} from '../polyfill-support-lite.js';

let elementToUpgrade: HTMLElement;
const upgradeElement = (element: HTMLElement, ctor: typeof LitHTMLElement) => {
  Object.setPrototypeOf(element, ctor.prototype);
  elementToUpgrade = element;
  new ctor();
};

/**
 * Extend the `LitHTMLElement` to create a shimmed, custom element that
 * works on browsers without native custom elements by leveraging Lit
 * to manage the element's lifecycle.
 */
export const LitHTMLElement = function HTMLElement(this: HTMLElement) {
  return elementToUpgrade;
} as unknown as CustomElementConstructor & {observedAttributes?: string[]};

LitHTMLElement.prototype = Object.create(HTMLElement.prototype);
Object.defineProperty(LitHTMLElement.prototype, 'constructor', {
  writable: true,
  configurable: true,
  enumerable: false,
  value: LitHTMLElement,
});

LitHTMLElement.prototype.__setAttribute = HTMLElement.prototype.setAttribute;
LitHTMLElement.prototype.setAttribute = function (name: string, value: string) {
  const old = this.getAttribute(name);
  this.__setAttribute(name, value);
  const {observedAttributes, attributeChangedCallback} =
    litCustomElements._registry.get(this.localName);
  if (observedAttributes.has(name)) {
    attributeChangedCallback.call(this, name, old, value);
  }
};

LitHTMLElement.prototype.__removeAttribute =
  HTMLElement.prototype.removeAttribute;
LitHTMLElement.prototype.removeAttribute = function (name: string) {
  const old = this.getAttribute(name);
  this.__removeAttribute(name);
  const {observedAttributes, attributeChangedCallback} =
    litCustomElements._registry.get(this.localName);
  if (observedAttributes.has(name)) {
    attributeChangedCallback.call(this, name, old, null);
  }
};

interface LitCustomElementDefinition {
  ctor: typeof LitHTMLElement;
  observedAttributes?: Set<string>;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue?: string | null,
    newValue?: string | null,
    namespace?: string | null
  ): void;
}

/**
 * Registry for defining `LiteCustomElements`, shimmed custom elements that
 * works on browsers without native custom elements by leveraging Lit
 * to manage the element's lifecycle.
 */
export const litCustomElements = {
  _registry: new Map(),
  get(name: string) {
    return this._registry.get(name)?.ctor;
  },
  define(name: string, ctor: typeof LitHTMLElement) {
    const {
      observedAttributes,
      prototype: {
        connectedCallback,
        disconnectedCallback,
        attributeChangedCallback,
      },
    } = ctor;
    this._registry.set(name, {
      ctor,
      observedAttributes: new Set(observedAttributes),
      connectedCallback,
      disconnectedCallback,
      attributeChangedCallback,
    } as LitCustomElementDefinition);
  },
};

export class LitCustomElementDirective extends AsyncDirective {
  definition: LitCustomElementDefinition | undefined = undefined;
  element!: InstanceType<CustomElementConstructor>;

  override disconnected() {
    super.disconnected();
    this.definition?.disconnectedCallback?.call(this.element);
  }

  override reconnected() {
    super.reconnected();
    this.connected();
  }

  connected() {
    this.definition?.connectedCallback?.call(this.element);
  }

  render() {
    return nothing;
  }

  override update(part: ElementPart) {
    this.element ??= part.element as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this.element as any).__$litCustomElementUpgraded === undefined) {
      this.upgrade();
    }
    return this.render();
  }

  upgrade() {
    this.definition = litCustomElements._registry.get(this.element.localName);
    if (this.definition !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.element as any).__$litCustomElementUpgraded = true;
      upgradeElement(this.element, this.definition.ctor);
      if (this.isConnected) {
        this.connected();
      }
    }
  }
}

/**
 * Directive for managing a shimmed custom elements that
 * works on browsers without native custom elements by leveraging Lit
 * to manage the element's lifecycle.
 */
export const litCustomElement = directive(LitCustomElementDirective);

ElementPartProcessors.add((el: Element) =>
  el.localName.includes('-') ? litCustomElement() : undefined
);
