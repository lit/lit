/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit-element';
import {
  msg,
  configureTransformLocalization,
  LOCALE_STATUS_EVENT,
} from '../../../lit-localize.js';
import {Localized} from '../../../localized-element.js';

const {getLocale} = configureTransformLocalization({sourceLocale: 'en'});
console.log(`Locale is ${getLocale()}`);

window.addEventListener(LOCALE_STATUS_EVENT, (event) => {
  console.log(event.detail.status);
});

msg('Hello World!', {id: 'string'});

msg(html`Hello <b><i>World!</i></b>`, {id: 'lit'});

msg((name: string) => `Hello ${name}!`, {id: 'variables_1', args: ['World']});

msg(
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  {id: 'lit_variables_1', args: ['https://www.example.com/', 'World']}
);

export class MyElement extends Localized(LitElement) {
  render() {
    return html`<p>
      ${msg(html`Hello <b><i>World!</i></b>`, {id: 'lit'})} (${getLocale()})
    </p>`;
  }
}
