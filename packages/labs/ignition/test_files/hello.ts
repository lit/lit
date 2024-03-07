import {html} from 'lit';

export const simple = () => html`<div>Hello, world!</div>`;

export const customElement = () => html`<x-foo>Hello, world!</x-foo>`;

export const withAttribute = () => html`<div class="a">Hello, world!</div>`;

export const withUnquotedAttribute = () =>
  html`<div hidden>Hello, world!</div>`;

export const withChildren = () => html`<div class="a"><span>A</span></div>`;

export const nested = () => html`
  <div class="a">
    ${html`<span>A</span>`}
    <span></span>
  </div>
  <div class="b"></div>
`;
