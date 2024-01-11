/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file will be loaded by Node from the node:test-dom-shim script to verify
// `ReactiveElement` will prefer extending existing `HTMLElement` from the
// global rather than the built-in shim

import './node-shim-html-element.js';
import {ReactiveElement} from '@lit/reactive-element';
import {HTMLElement} from '@lit-labs/ssr-dom-shim';

import assert from 'node:assert/strict';
assert.strictEqual(
  Object.getPrototypeOf(ReactiveElement),
  globalThis.HTMLElement,
  'Expected ReactiveElement to extend existing globalThis.HTMLElement'
);
assert.notStrictEqual(
  Object.getPrototypeOf(ReactiveElement),
  HTMLElement,
  'Expected ReactiveElement to not extend HTMLElement from ssr-dom-shim'
);
