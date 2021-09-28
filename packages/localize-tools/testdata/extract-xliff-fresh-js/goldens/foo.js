/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {msg} from '@lit/localize';

const name = 'friend';
msg(html`Hello <b>${name}!</b>`, {desc: 'Friendly greeting'});
