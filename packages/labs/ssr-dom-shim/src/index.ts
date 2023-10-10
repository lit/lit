/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ElementInternalsShim} from './lib/element-internals.js';

export {
  ariaMixinAttributes,
  ElementInternals,
  HYDRATE_INTERNALS_ATTR_PREFIX,
} from './lib/element-internals.js';

const attributes = new WeakMap<
  InstanceType<typeof HTMLElementShim>,
  Map<string, string>
>();
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
//    hence e.g. `class Element`.
// 2. We can't shadow the global types with a simple class declaration, because
//    then we can't reference the global types for casting, hence e.g.
//    `const ElementShim = class Element`.
// 3. We want to export the classes typed as the real ones, hence e.g.
//    `const ElementShimWithRealType = ElementShim as object as typeof Element;`.
// 4. We want the exported names to match the real ones, hence e.g.
//    `export {ElementShimWithRealType as Element}`.
const ElementShim = class Element {
  get attributes() {
    return Array.from(attributesForElement(this)).map(([name, value]) => ({
      name,
      value,
    }));
  }
  private __shadowRootMode: null | ShadowRootMode = null;
  protected __shadowRoot: null | ShadowRoot = null;
  protected __internals: null | ElementInternals = null;

  get shadowRoot() {
    if (this.__shadowRootMode === 'closed') {
      return null;
    }
    return this.__shadowRoot;
  }
  setAttribute(name: string, value: unknown): void {
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
    this.__shadowRootMode = init.mode;
    if (init && init.mode === 'open') {
      this.__shadowRoot = shadowRoot;
    }
    return shadowRoot;
  }
  attachInternals(): ElementInternals {
    if (this.__internals !== null) {
      throw new Error(
        `Failed to execute 'attachInternals' on 'HTMLElement': ` +
          `ElementInternals for the specified element was already attached.`
      );
    }
    const internals = new ElementInternalsShim(this as unknown as HTMLElement);
    this.__internals = internals;
    return internals as ElementInternals;
  }
  getAttribute(name: string) {
    const value = attributesForElement(this).get(name);
    return value ?? null;
  }
};
const ElementShimWithRealType = ElementShim as object as typeof Element;
export {ElementShimWithRealType as Element};

const HTMLElementShim = class HTMLElement extends ElementShim {};
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
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `'CustomElementRegistry' already has "${name}" defined. ` +
            `This may have been caused by live reload or hot module ` +
            `replacement in which case it can be safely ignored.\n` +
            `Make sure to test your application with a production build as ` +
            `repeat registrations will throw in production.`
        );
      } else {
        throw new Error(
          `Failed to execute 'define' on 'CustomElementRegistry': ` +
            `the name "${name}" has already been used with this registry`
        );
      }
    }
    this.__definitions.set(name, {
      ctor,
      // Note it's important we read `observedAttributes` in case it is a getter
      // with side-effects, as is the case in Lit, where it triggers class
      // finalization.
      //
      // TODO(aomarks) To be spec compliant, we should also capture the
      // registration-time lifecycle methods like `connectedCallback`. For them
      // to be actually accessible to e.g. the Lit SSR element renderer, though,
      // we'd need to introduce a new API for accessing them (since `get` only
      // returns the constructor).
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
