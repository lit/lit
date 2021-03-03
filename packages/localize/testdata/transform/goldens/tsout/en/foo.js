/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement, html} from 'lit-element';
const {getLocale} = {getLocale: () => 'en'};
console.log(`Locale is ${getLocale()}`);
window.addEventListener('lit-localize-status', (event) => {
  console.log(event.detail.status);
});
('Hello World!');
html`Hello <b><i>World!</i></b>`;
`Hello World!`;
html`Hello World, click <a href="https://www.example.com/">here</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      Hello <b><i>World!</i></b> (${getLocale()})
    </p>`;
  }
}
