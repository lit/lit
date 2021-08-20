/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {msg, str} from '@lit/localize';

const user = 'Friend';
const url = 'https://www.example.com/';

// Plain string
msg('Hello World!');

// Plain string with expression
msg(str`Hello ${user}!`);

// Lit template
msg(html`Hello <b>World</b>!`);

// Lit template with variable expression (one placeholder)
msg(html`Hello <b>${user}</b>!`);

// Lit template with variable expression (two placeholders)
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

// Lit template with expression order inversion
msg(html`a:${'A'} b:${'B'} c:${'C'}`);

// Custom ID
msg('Hello World', {id: 'myId'});

// Description
msg('described 0', {desc: 'Description of 0'});

// This example has 4 <ph> placeholders. The 2nd has two expressions, and the
// rest have 0 expressions. Ensure that we index these expressions as [0, 1] by
// counting _expressions_, instead of [2, 2] by counting _placeholders_ See
// https://github.com/lit/lit/issues/1896).
const urlBase = 'http://example.com/';
const urlPath = 'foo';
msg(html`<b>Hello</b>! Click <a href="${urlBase}/${urlPath}">here</a>!`);

// Escaped markup characters should remain escaped
msg(html`&lt;Hello<b>&lt;World &amp; Friends&gt;</b>!&gt;`);
