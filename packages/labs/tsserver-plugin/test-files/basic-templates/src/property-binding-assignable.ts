/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, nothing, noChange} from 'lit';
import {simpleDirective, genericDirective} from './directives.js';

// .id expects a string; providing a string should be assignable.
export const good = html`<div .id=${'hello-id'}></div>`;

// .textContent also expects a string; number concatenation ensures string.
const num = 42;
export const alsoGood = html`<div .textContent=${'value-' + num}></div>`;

export const simpleNothing = html`<div .id=${nothing}></div>`;

export const simpleNoChange = html`<div .id=${noChange}></div>`;

export const prefixBinding = html`<div .id="hello ${3}"></div>`;

export const postfixBinding = html`<div .id="${3} world"></div>`;

export const multiBinding = html`<div .id="${3}${4}"></div>`;

export const useSimpleDirective = html`<div
  .id=${simpleDirective('hello-id')}
></div>`;

const maybeStr = Math.random() > 0.5 ? 'hello' : undefined;

export const useGenericDirective = html`<div
  .id=${genericDirective(maybeStr)}
></div>`;

// Good assignment to unknown non-custom element.

html` <unknownel .id=${'hello'}></unknownel> `;

// Good assignment to unknown custom element.

html` <unknown-el .id=${'hello'}></unknown-el> `;
