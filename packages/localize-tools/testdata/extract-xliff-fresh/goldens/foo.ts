/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {msg} from '@lit/localize';

msg('Hello World!', {desc: 'Description of Hello World'});

const name = 'friend';
msg(html`Hello <b>${name}!</b>`, {desc: 'Description of Hello $(name)'});

// Escaped markup characters should remain escaped
msg(html`&lt;Hello<b>&lt;World &amp; Friends&gt;</b>!&gt;`);

// A localized Lit template that contains a nested Lit template.
msg(html`Hello <b>${html`<i>World</i>`}</b>!`);
