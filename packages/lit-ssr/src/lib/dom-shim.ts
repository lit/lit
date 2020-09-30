/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

/**
 * This module *minimally* implements the DOM interfaces needed for lit-html and
 * LitElement to boot. Since most of the implementation of lit-html and
 * LitElement are not actually used, we mostly just need to defining base
 * classes for extension, etc. We will have a roughly functioning
 * CustomElementRegistry however.
 */

import fetch from 'node-fetch';

/**
 * Constructs a fresh instance of the "window" vm context to use for 
 * evaluating user SSR code.  Includes a minimal shim of DOM APIs.
 * 
 * @param props Additional properties to add to the window global 
 */
export const getWindow = (props: {[key: string]: any} = {}): {[key: string]: any} => {

  const attributes: WeakMap<any, Map<string, string>> = new WeakMap();
  const attributesForElement = (element: any) => {
    let attrs = attributes.get(element);
    if (!attrs) {
      attributes.set(element, attrs = new Map());
    }
    return attrs;
  }

  abstract class HTMLElement {
    get attributes() {
      return Array.from(attributesForElement(this))
        .map(([name, value]) => ({name, value}));
    }
    abstract attributeChangedCallback?(name: string, old: string | null, value: string | null): void;
    setAttribute(name: string, value: string) {
      attributesForElement(this).set(name, value);
    }
    removeAttribute(name: string) {
      attributesForElement(this).delete(name);
    }
    hasAttribute(name: string) {
      return attributesForElement(this).has(name);
    }
    attachShadow() {
      return { host: this };
    }
    getAttribute(name: string) {
      const value = attributesForElement(this).get(name);
      return value === undefined ? null : value;
    }
  };

  class Document {
    get adoptedStyleSheets() {
      return [];
    }
  };

  class CSSStyleSheet {
    replace() {}
  };

  type CustomElementRegistration = {
    ctor: {new (): HTMLElement};
    observedAttributes: string[];
  };

  class CustomElementRegistry {
    __definitions = new Map<string, CustomElementRegistration>();

    define(name: string, ctor: {new (): HTMLElement}) {
      this.__definitions.set(name, {
        ctor,
        observedAttributes: (ctor as any).observedAttributes,
      });
    }

    get(name: string) {
      const definition = this.__definitions.get(name);
      return definition && definition.ctor;
    }
  };

  // btoa Polyfill from  https://github.com/MaxArt2501/base64-js/blob/master/base64.js
  // base64 character set, plus padding character (=)
  const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  const btoa = (string: string) => {
    string = String(string);
    let bitmap,
      a,
      b,
      c,
      result = '',
      i = 0,
      rest = string.length % 3; // To determine the final padding

    for (; i < string.length; ) {
      if (
        (a = string.charCodeAt(i++)) > 255 ||
        (b = string.charCodeAt(i++)) > 255 ||
        (c = string.charCodeAt(i++)) > 255
      )
        throw new TypeError(
          "Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range."
        );

      bitmap = (a << 16) | (b << 8) | c;
      result +=
        b64.charAt((bitmap >> 18) & 63) +
        b64.charAt((bitmap >> 12) & 63) +
        b64.charAt((bitmap >> 6) & 63) +
        b64.charAt(bitmap & 63);
    }

    // If there's need of padding, replace the last 'A's with equal signs
    return rest ? result.slice(0, rest - 3) + '==='.substring(rest) : result;
  };

  const window = {
    HTMLElement,
    Document,
    CSSStyleSheet,
    customElements: new CustomElementRegistry(),
    btoa,
    console: {
      log(...args: any[]) { console.log(...args); },
      info(...args: any[]) { console.info(...args); },
      warn(...args: any[]) { console.warn(...args); },
      debug(...args: any[]) { console.debug(...args); },
    },
    fetch: (url: URL, init: {}) => fetch(url, init),
    
    // No-op any async tasks
    requestAnimationFrame() { },
    setTimeout() { },   
    clearTimeout() { },

    // Required for node-fetch
    Buffer,

    // Set below
    window: undefined as any,
    global: undefined as any,

    // User-provided globals, like `require`
    ...props
  };

  window.window = window;
  window.global = window; // Required for node-fetch

  return window;
}
