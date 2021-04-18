/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {msg} from '@lit/localize';

msg('Hello World!', {
  desc: 'Description of Hello World',
});

const name = 'friend';
msg(html`Hello <b>${name}!</b>`, {
  desc: 'Description of Hello $(name)',
});
