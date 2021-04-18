/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement, html} from 'lit';
const {getLocale} = {getLocale: () => 'es-419'};
console.log(`Locale is ${getLocale()}`);
window.addEventListener('lit-localize-status', (event) => {
  console.log(event.detail.status);
});
const user = 'Friend';
const url = 'https://www.example.com/';
// Plain string
`Hola Mundo!`;
// Plain string with expression
`Hola ${user}!`;
// Lit template
html`Hola <b>Mundo</b>!`;
// Lit template with one XLIFF placeholder (combined start tag + expression +
// end tag).
html`Hola <b>${user}</b>!`;
// Lit template with two XLIFF placeholders (combined start tag + expression,
// separate end tag).
html`Clic <a href="${url}">aquí</a>!`;
// Lit template with string expression
//
// TODO(aomarks) The "SALT" text is here because we have a check to make sure
// that two messages can't have the same ID unless they have identical template
// contents. After https://github.com/Polymer/lit-html/issues/1621 is
// implemented, add a "meaning" parameter instead.
html`[SALT] Clic <a href="https://www.example.com/">aquí</a>!`;
// Lit template with nested msg expression
html`[SALT] Hola <b>Mundo</b>!`;
// Lit template with comment
html`Hola <b><!-- comment -->Mundo</b>!`;
// Custom ID
`Hola Mundo`;
export class MyElement extends LitElement {
  render() {
    return html`<p>Hola <b>Mundo</b>! (${getLocale()})</p>`;
  }
}
