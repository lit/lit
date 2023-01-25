/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {msg, str} from '@lit/localize';

const who = 'World';
msg(str`I am translated. Hello ${who}.`, {desc: 'Description of translated'});
msg('I am not translated', {desc: 'Description of not translated'});
msg('I am translated with a note', {desc: 'Happy note'});
msg('My note needs to be migrated', {desc: 'Existing note'});
