/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

 import {html} from 'lit-html';
 import {msg} from '../../../lit-localize.js';

msg('Hello World!');

const name = 'friend';
msg(html`Hello <b>${name}!</b>`);
