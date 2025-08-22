/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit';

// .id expects a string; providing a string should be assignable.
export const good = html`<div .id=${'hello-id'}></div>`;

// .textContent also expects a string; number concatenation ensures string.
const num = 42;
export const alsoGood = html`<div .textContent=${'value-' + num}></div>`;
