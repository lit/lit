/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {msg, str} from '@lit/localize';

const name = 'Friend';

msg(`Hello World`, {id: 'extra-expression'});
msg(str`Hello ${name}`, {id: 'missing-expression'});
msg(html`<b>Hello World</b>`, {id: 'missing-html'});
msg(html`<b>Hello World</b>`, {id: 'changed-html'});
