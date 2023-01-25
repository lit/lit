/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This file is used as a side-effectful import in `node-dom-shim.js` to
// simulate loading a separate DOM shim that adds `HTMLElement` to the global

class FakeHTMLElement {}
globalThis.HTMLElement = FakeHTMLElement as typeof HTMLElement;
