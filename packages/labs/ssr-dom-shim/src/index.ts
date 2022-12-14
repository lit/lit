/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const attributes: WeakMap<HTMLElement, Map<string, string>> = new WeakMap();
const attributesForElement = (element: HTMLElement) => {
  let attrs = attributes.get(element);
  if (!attrs) {
    attributes.set(element, (attrs = new Map()));
  }
  return attrs;
};

class Element {}

export abstract class HTMLElement extends Element {
  get attributes() {
    return Array.from(attributesForElement(this)).map(([name, value]) => ({
      name,
      value,
    }));
  }
  private _shadowRoot: null | ShadowRoot = null;
  get shadowRoot() {
    return this._shadowRoot;
  }
  abstract attributeChangedCallback?(
    name: string,
    old: string | null,
    value: string | null
  ): void;
  setAttribute(name: string, value: unknown) {
    // Emulate browser behavior that silently casts all values to string. E.g.
    // `42` becomes `"42"` and `{}` becomes `"[object Object]""`.
    attributesForElement(this).set(name, String(value));
  }
  removeAttribute(name: string) {
    attributesForElement(this).delete(name);
  }
  hasAttribute(name: string) {
    return attributesForElement(this).has(name);
  }
  attachShadow(init: ShadowRootInit) {
    const shadowRoot = {host: this};
    if (init && init.mode === 'open') {
      this._shadowRoot = shadowRoot;
    }
    return shadowRoot;
  }
  getAttribute(name: string) {
    const value = attributesForElement(this).get(name);
    return value === undefined ? null : value;
  }
}

interface CustomHTMLElement {
  new (): HTMLElement;
  observedAttributes?: string[];
}

class ShadowRoot {}

type CustomElementRegistration = {
  ctor: {new (): HTMLElement};
  observedAttributes: string[];
};

class CustomElementRegistry {
  private __definitions = new Map<string, CustomElementRegistration>();

  define(name: string, ctor: CustomHTMLElement) {
    this.__definitions.set(name, {
      ctor,
      observedAttributes: (ctor as CustomHTMLElement).observedAttributes ?? [],
    });
  }

  get(name: string) {
    const definition = this.__definitions.get(name);
    return definition && definition.ctor;
  }
}

export const customElements = new CustomElementRegistry();
