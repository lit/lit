/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview Side-effect import meant to be loaded on the **server** before
 * any user code is loaded. Patches `React.createElement` to support deep SSR of
 * Lit components.
 */

// TODO(augustjk) Remove when https://github.com/lit/lit/pull/3522 lands
import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import React from 'react';
import {patchCreateElement} from '../lib/utils.js';

// The base class of `ReactiveElement` could be an empty class from the Node
// build of reactive-element if it was loaded before the DOM shim. Replace
// prototype if that's the case.
// TODO(augustjk) Remove when https://github.com/lit/lit/pull/3522 lands
import {ReactiveElement} from 'lit';
if (!('getAttribute' in ReactiveElement.prototype)) {
  Object.setPrototypeOf(ReactiveElement.prototype, HTMLElement.prototype);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React.createElement as any) = patchCreateElement(React.createElement);
