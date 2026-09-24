/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Buffer is not (yet) exposed as a global symbol in a ShadowRealm,
// so we need to import it.
import {Buffer} from 'buffer';
import {
  HTMLElement,
  Element,
  Event,
  CustomEvent,
  EventTarget,
  CSSStyleSheet,
  CustomElementRegistry,
} from '@lit-labs/ssr-dom-shim';

/**
 * Install the DOM shim symbols on globalThis.
 * https://github.com/tc39/proposal-shadowrealm
 * https://github.com/nodejs/node/issues/42528
 */

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

// This module is expected to be imported in a ShadowRealm
// and should polyfill a browser environment inside that
// ShadowRealm.
Object.assign(globalThis, {
  EventTarget,
  Event: globalThis.Event ?? Event,
  CustomEvent: globalThis.CustomEvent ?? CustomEvent,
  Element,
  HTMLElement,
  Document,
  document: new Document(),
  CSSStyleSheet,
  ShadowRoot,
  CustomElementRegistry,
  customElements: new CustomElementRegistry(),
  atob(s: string) {
    return Buffer.from(s, 'base64').toString('binary');
  },
  btoa(s: string) {
    return Buffer.from(s, 'binary').toString('base64');
  },
  location: new URL('http://localhost'),
  MutationObserver: class {
    observe() {}
  },

  // No-op any async tasks
  requestAnimationFrame() {},
  window: globalThis,
});
