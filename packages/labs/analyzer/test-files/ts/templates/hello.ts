import {html} from 'lit';
import {ref} from 'lit/directives/ref.js';

export const simple = () => html`<div>Hello, world!</div>`;

export const customElement = () => html`<x-foo>Hello, world!</x-foo>`;

export const withAttribute = () => html`<div class="a">Hello, world!</div>`;

export const withUnquotedAttribute = () =>
  html`<div hidden>Hello, world!</div>`;

export const withChildren = () => html`<div class="a"><span>A</span></div>`;

export const withChildBinding = () =>
  html`<div class="a">${'a'}<span>A</span></div>`;

export const nested = () => html`
  <div class="a">
    ${html`<span>A</span>`}
    <span></span>
  </div>
  <div class="b"></div>
`;

export const withAttributeBinding = () =>
  html`<div class=${'a'}><span>Hello, world!</span></div>`;

export const withQuotedAttributeBinding = () =>
  html`<div class="${'a'}"><span>Hello, world!</span></div>`;

export const withMultiAttributeBinding = () =>
  html`<div class="${'a'} ${'b'}"><span>Hello, world!</span></div>`;

export const withElementBinding = () =>
  html`<div ${ref()}><span>Hello, world!</span></div>`;

// prettier-ignore
export const withChildBindingWithSpaces = () =>
  html`<div class="a">${ 'a' }<span>A</span></div>`;

// prettier-ignore
export const withAttributeBindingWithSpaces = () =>
  html`<div class=${ 'a' }><span>Hello, world!</span></div>`;

// prettier-ignore
export const withElementBindingWithSpaces = () =>
  html`<div ${  ref()  }><span>Hello, world!</span></div>`;

// prettier-ignore
export const withMultiLineChildExpression = () => html`
  <div class="a">
    ${html`
      <p>A</p>
      <p>B</p>
    `}
  </div>
  <div class="b"></div>
`;

// prettier-ignore
export const withMultiLineAttributeExpression = () => html`
  <div class="${[
    'a',
    'b'].join(' ')}">
    <span>A</span>
  </div>
  <div class="b"></div>
`;
