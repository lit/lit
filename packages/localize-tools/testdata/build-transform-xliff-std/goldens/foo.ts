/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {
  msg,
  str,
  configureTransformLocalization,
  updateWhenLocaleChanges,
  localized,
  LOCALE_STATUS_EVENT,
} from '@lit/localize';

const {getLocale} = configureTransformLocalization({sourceLocale: 'en'});
console.log(`Locale is ${getLocale()}`);

window.addEventListener(LOCALE_STATUS_EVENT, (event) => {
  console.log(event.detail.status);
});

const user = 'Friend';
const url = 'https://www.example.com/';

// Plain string
msg('Hello World!');

// Plain string with expression
msg(str`Hello ${user}!`);

// Lit template
msg(html`Hello <b>World</b>!`);

// Lit template with one XLIFF placeholder (combined start tag + expression +
// end tag).
msg(html`Hello <b>${user}</b>!`);

// Lit template with two XLIFF placeholders (combined start tag + expression,
// separate end tag).
msg(html`Click <a href=${url}>here</a>!`);

// Lit template with string expression
//
// TODO(aomarks) The "SALT" text is here because we have a check to make sure
// that two messages can't have the same ID unless they have identical template
// contents. After https://github.com/lit/lit/issues/1621 is
// implemented, add a "meaning" parameter instead.
msg(html`[SALT] Click <a href="${'https://www.example.com/'}">here</a>!`);

// Lit template with nested msg expression
msg(html`[SALT] Hello <b>${msg('World')}</b>!`);

// Lit template with comment
msg(html`Hello <b><!-- comment -->World</b>!`);

// Custom ID
msg('Hello World', {id: 'myId'});

// updateWhenLocaleChanges -> undefined
export class MyElement1 extends LitElement {
  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }
  render() {
    return html`<p>${msg(html`Hello <b>World</b>!`)} (${getLocale()})</p>`;
  }
}

// @localized -> removed
@localized()
export class MyElement2 extends LitElement {
  render() {
    return html`<p>${msg(html`Hello <b>World</b>!`)} (${getLocale()})</p>`;
  }
}

// Escaped markup characters should remain escaped
msg(html`&lt;Hello<b>&lt;World &amp; Friends&gt;</b>!&gt;`);

// Expressions as attribute values should stay as expressions
html`Hello <b foo=${'World'}>World</b>`;
html`Hello <b foo=${msg('World')}>World</b>`;
html`<b foo=${msg('Hello')}>Hello</b><b bar=${msg('World')}>World</b>`;
html`Hello <b .foo=${'World'}>World</b>`;
html`Hello <b .foo=${msg('World')}>World</b>`;
