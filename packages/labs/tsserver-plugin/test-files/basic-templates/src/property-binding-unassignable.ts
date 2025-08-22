/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit';

// .id is a string, passing a number should produce unassignable diagnostic (6302)
export const bad = html`<div .id=${123}></div>`;

// .hidden is a boolean, passing a string should produce unassignable (6302)
export const bad2 = html`<div .hidden=${'not-bool'}></div>`;
