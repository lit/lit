/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This module *minimally* implements the DOM interfaces needed for lit-html and
 * LitElement to boot. Since most of the implementation of lit-html and
 * LitElement are not actually used, we mostly just need to defining base
 * classes for extension, etc. We will have a roughly functioning
 * CustomElementRegistry however.
 */

import fetch from 'node-fetch';

/**
 * Constructs a fresh instance of the "window" vm context to use for evaluating
 * user SSR code. Includes a minimal shim of DOM APIs.
 *
 * @param includeJSBuiltIns Whether certain standard JS context globals like
 *  `console` and `setTimeout` should also be added to the global. Should
 *  generally only be true when adding window to a fresh VM context that
 *  starts with nothing.
 * @param props Additional properties to add to the window global
 * @param exposeWindow Whether the `window` object should be exposed globally
 */
export const getWindow = ({
  includeJSBuiltIns = false,
  props = {},
  exposeWindow = true,
}): {[key: string]: unknown} => {
  const attributes: WeakMap<HTMLElement, Map<string, string>> = new WeakMap();
  const attributesForElement = (element: HTMLElement) => {
    let attrs = attributes.get(element);
    if (!attrs) {
      attributes.set(element, (attrs = new Map()));
    }
    return attrs;
  };

  class Element {}

  abstract class HTMLElement extends Element {
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

  class Document {
    get adoptedStyleSheets() {
      return [];
    }
    createTreeWalker() {
      return {};
    }
    createTextNode() {
      return {};
    }
    createElement() {
      return {};
    }
  }

  class CSSStyleSheet {
    replace() {}
  }

  type CustomElementRegistration = {
    ctor: {new (): HTMLElement};
    observedAttributes: string[];
  };

  class CustomElementRegistry {
    private __definitions = new Map<string, CustomElementRegistration>();

    define(name: string, ctor: CustomHTMLElement) {
      this.__definitions.set(name, {
        ctor,
        observedAttributes:
          (ctor as CustomHTMLElement).observedAttributes ?? [],
      });
    }

    get(name: string) {
      const definition = this.__definitions.get(name);
      return definition && definition.ctor;
    }
  }

  const window = {
    Element,
    HTMLElement,
    Document,
    document: new Document(),
    CSSStyleSheet,
    ShadowRoot,
    CustomElementRegistry,
    customElements: new CustomElementRegistry(),
    btoa(s: string) {
      return Buffer.from(s, 'binary').toString('base64');
    },
    fetch: (url: URL, init: {}) =>
      // TODO(aomarks) The typings from node-fetch are wrong because they don't
      // allow URL.
      fetch(url as unknown as Parameters<typeof fetch>[0], init),

    location: new URL('http://localhost'),
    MutationObserver: class {
      observe() {}
    },

    // No-op any async tasks
    requestAnimationFrame() {},

    // Set below
    window: undefined as unknown,

    // User-provided globals, like `require`
    ...props,
  };

  // Many libraries look for `window` to determine a browser environment
  // This prevents that exposure as `globalThis` is enough in the vast majority of cases
  // This is currently off by default, but may become default in future versions
  // See https://github.com/lit/lit/issues/3412
  if (exposeWindow) {
    window.window = window;
  }

  if (includeJSBuiltIns) {
    Object.assign(window, {
      // No-op any async tasks
      setTimeout() {},
      clearTimeout() {},
      // Required for node-fetch
      Buffer,
      URL,
      URLSearchParams,
      console: {
        log(...args: unknown[]) {
          console.log(...args);
        },
        info(...args: unknown[]) {
          console.info(...args);
        },
        warn(...args: unknown[]) {
          console.warn(...args);
        },
        debug(...args: unknown[]) {
          console.debug(...args);
        },
        error(...args: unknown[]) {
          console.error(...args);
        },
        assert(bool: unknown, msg: string) {
          if (!bool) {
            throw new Error(msg);
          }
        },
      },
    });
  }

  return window;
};

export const installWindowOnGlobal = (
  props: {[key: string]: unknown} = {},
  exposeWindow = true
) => {
  // Avoid installing the DOM shim if one already exists
  if (globalThis.window === undefined) {
    const window = getWindow({props, exposeWindow});
    // Copy initial window globals to node global
    Object.assign(globalThis, window);
    // Set up global reference to window so all globals added to window are
    // added to the node global, unless we explicitly don't want to do this.
    if (exposeWindow) {
      globalThis.window = globalThis as typeof globalThis & Window;
    }
  }
};
