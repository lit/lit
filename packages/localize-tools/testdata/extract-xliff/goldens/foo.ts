/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit-html';
import {msg} from '@lit/localize';

/** @desc Description of Hello World */
msg('Hello World!');

const name = 'friend';
/** @desc Description of Hello $(name) */
msg(html`Hello <b>${name}!</b>`);
