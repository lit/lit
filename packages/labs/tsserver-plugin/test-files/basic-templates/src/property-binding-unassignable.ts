/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit';
import {simpleDirective, genericDirective} from './directives.js';

// .id is a string, passing a number should produce unassignable diagnostic (6302)
export const bad = html`<div .id=${123}></div>`;

// .hidden is a boolean, passing a string should produce unassignable (6302)
export const bad2 = html`<div .hidden=${'not-bool'}></div>`;

const fakeNothing = Symbol('nothing');
const fakeNoChange: unique symbol = Symbol('noChange');

export const moreBad = html`<div .id=${fakeNothing}></div>`;

export const moreBad2 = html`<div .hidden=${fakeNoChange}></div>`;

// Use bespoke types so that when we assert on the messages they are
// unique.
class FailureType1 {
  failureType1!: never;
}
class FailureType2 {
  failureType2!: never;
}
class FailureType3 {
  failureType3!: never;
}
class FailureType4 {
  failureType4!: never;
}
class FailureType5 {
  failureType5!: never;
}
class FailureType6 {
  failureType6!: never;
}
class FailureType7 {
  failureType7!: never;
}

class SimpleElement extends HTMLElement {
  failureType1: FailureType1;
  failureType2: FailureType2;
  failureType3: FailureType3;
  failureType4: FailureType4;
  failureType5: FailureType5;
}
customElements.define('simple-element', SimpleElement);
declare global {
  interface HTMLElementTagNameMap {
    'simple-element': SimpleElement;
  }
}

export const prefixBindingBad = html`<simple-element
  .failureType1="hello ${3}"
></simple-element>`;

export const postfixBindingBad = html`<simple-element
  .failureType2="${4} world"
></simple-element>`;

export const multiBindingBad = html`<simple-element
  .failureType3="${3}${4}"
></simple-element>`;

export const simpleDirectiveBad = html`<simple-element
  .failureType4=${simpleDirective('ok')}
></simple-element>`;

export const genericDirectiveBad = html`<simple-element
  .failureType5=${genericDirective('ok')}
></simple-element>`;

// Type error assigning to a known field on an unknown element
export const unknownElementBad = html`
  <unknownel .id=${new FailureType6()}></unknownel>
`;

// Type error assigning to a known field on an unknown custom element.
export const unknownCustomElementBad = html`
  <unknown-el .id=${new FailureType7()}></unknown-el>
`;
