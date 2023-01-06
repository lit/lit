/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const attributes: WeakMap<
  InstanceType<typeof HTMLElementShim>,
  Map<string, string>
> = new WeakMap();
const attributesForElement = (
  element: InstanceType<typeof HTMLElementShim>
) => {
  let attrs = attributes.get(element);
  if (attrs === undefined) {
    attributes.set(element, (attrs = new Map()));
  }
  return attrs;
};

// The typings around the exports below are a little funky:
//
// 1. We want the `name` of the shim classes to match the real ones at runtime,
//    hence e.g. `class HTMLElement`.
// 2. We can't shadow the global types with a simple class declaration, because
//    then we can't reference the global types for casting, hence
//    `const HTMLElementShim = class HTMLElement`.
// 3. We want to export the classes typed as the real ones, hence e.g. `const
//    HTMLElementShimTyped = HTMLElementShim as object as typeof HTMLElement;`.
// 4. We want the exported names to match the real ones, hence e.g.
//    `export {HTMLElementShimWithRealType as HTMLElement}`.

const ElementShim = class Element {};
const ElementShimWithRealType = ElementShim as object as typeof Element;
export {ElementShimWithRealType as Element};

const HTMLElementShim = class HTMLElement extends ElementShim {
  get attributes() {
    return Array.from(attributesForElement(this)).map(([name, value]) => ({
      name,
      value,
    }));
  }
  private __shadowRoot: null | ShadowRoot = null;
  get shadowRoot() {
    return this.__shadowRoot;
  }
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
  attachShadow(init: ShadowRootInit): ShadowRoot {
    const shadowRoot = {host: this} as object as ShadowRoot;
    if (init && init.mode === 'open') {
      this.__shadowRoot = shadowRoot;
    }
    return shadowRoot;
  }
  getAttribute(name: string) {
    const value = attributesForElement(this).get(name);
    return value ?? null;
  }
};
const HTMLElementShimWithRealType =
  HTMLElementShim as object as typeof HTMLElement;
export {HTMLElementShimWithRealType as HTMLElement};

interface CustomHTMLElementConstructor {
  new (): HTMLElement;
  observedAttributes?: string[];
}

type CustomElementRegistration = {
  ctor: {new (): HTMLElement};
  observedAttributes: string[];
};

const CustomElementRegistryShim = class CustomElementRegistry {
  private __definitions = new Map<string, CustomElementRegistration>();

  define(name: string, ctor: CustomHTMLElementConstructor) {
    if (this.__definitions.has(name)) {
      throw new Error(
        `Failed to execute 'define' on 'CustomElementRegistry': ` +
          `the name "${name}" has already been used with this registry`
      );
    }
    this.__definitions.set(name, {
      ctor,
      observedAttributes: ctor.observedAttributes ?? [],
    });
  }

  get(name: string) {
    const definition = this.__definitions.get(name);
    return definition?.ctor;
  }
};
const CustomElementRegistryShimWithRealType =
  CustomElementRegistryShim as object as typeof CustomElementRegistry;
export {CustomElementRegistryShimWithRealType as CustomElementRegistry};

export const customElements = new CustomElementRegistryShimWithRealType();