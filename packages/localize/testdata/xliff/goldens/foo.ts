/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit-html';
import {msg} from '../../../lit-localize.js';

msg('Hello World!', {id: 'string'});

msg(html`Hello <b><i>World!</i></b>`, {id: 'lit'});

msg((name: string) => `Hello ${name}!`, {id: 'variables_1', args: ['World']});

msg(
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  {id: 'lit_variables_1', args: ['World', 'https://www.example.com/']}
);

msg((x: string) => html`${x}y${x}y${x}`, {id: 'lit_variables_2', args: ['x']});

msg(
  (x: string) => html`<b>${x}</b>
    <i>y</i>
    <b>${x}</b>
    <i>y</i>
    <b>${x}</b>`,
  {id: 'lit_variables_3', args: ['x']}
);

msg(html`Hello <b><!-- comment -->World!</b>`, {id: 'comment'});

// Auto IDs
msg(`Hello World!`);
msg((name) => `Hello ${name}!`, {args: ['Friend']});
msg(html`Hello <b>World</b>!`);
msg((name) => html`Hello <b>${name}</b>!`, {args: ['Friend']});

// msgdesc: Description of 0
msg('described 0');

// msgdesc: Parent description
export function described() {
  // msgdesc: Description of 1
  msg('described 1');
  // msgdesc: Description of 2
  msg('described 2');
}
