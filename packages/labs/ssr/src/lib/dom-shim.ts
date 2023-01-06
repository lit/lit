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
import {
  HTMLElement,
  Element,
  CustomElementRegistry,
} from '@lit-labs/ssr-dom-shim';

/**
 * Constructs a fresh instance of the "window" vm context to use for evaluating
 * user SSR code. Includes a minimal shim of DOM APIs.
 *
 * @param includeJSBuiltIns Whether certain standard JS context globals like
 *  `console` and `setTimeout` should also be added to the global. Should
 *  generally only be true when adding window to a fresh VM context that
 *  starts with nothing.
 * @param props Additional properties to add to the window global
 */
export const getWindow = ({
  includeJSBuiltIns = false,
  props = {},
}): {[key: string]: unknown} => {
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

export const installWindowOnGlobal = (props: {[key: string]: unknown} = {}) => {
  // Avoid installing the DOM shim if one already exists
  if (globalThis.window === undefined) {
    const window = getWindow({props});
    // Copy initial window globals to node global
    Object.assign(globalThis, window);
  }
};
