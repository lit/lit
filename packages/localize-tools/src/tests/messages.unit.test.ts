/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import {validateLocalizedPlaceholders} from '../messages.js';
import type {Message} from '../messages.js';
import type {Locale} from '../types/locale.js';

// ---------------------------------------------------------------------------
// TestValidateLocalizedPlaceholders
// ---------------------------------------------------------------------------

test('valid translation', () => {
  const programMsgs: Message[] = [
    {
      name: 'greeting',
      contents: [
        'Hello ',
        {untranslatable: '<b>', index: 0},
        'World',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'greeting',
      contents: [
        'Hola ',
        {untranslatable: '<b>', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, []);
});

test('extra expression', () => {
  const programMsgs: Message[] = [
    {
      name: 'extra-expression',
      contents: ['Hello World'],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'extra-expression',
      contents: ['Hola Mundo', {untranslatable: '${alert("evil")}', index: 0}],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, [
    `Placeholder error in es-419 localization of extra-expression: unexpected "\${alert("evil")}"`,
  ]);
});

test('missing expression', () => {
  const programMsgs: Message[] = [
    {
      name: 'missing-expression',
      contents: ['Hello ', {untranslatable: '${name}', index: 0}],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'missing-expression',
      contents: ['Hola'],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, [
    `Placeholder error in es-419 localization of missing-expression: missing "\${name}"`,
  ]);
});

test('missing HTML', () => {
  const programMsgs: Message[] = [
    {
      name: 'missing-html',
      contents: [
        {untranslatable: '<b>', index: 0},
        'Hello',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'missing-html',
      contents: ['Hola'],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, [
    `Placeholder error in es-419 localization of missing-html: missing "<b>"`,
    `Placeholder error in es-419 localization of missing-html: missing "</b>"`,
  ]);
});

test('changed HTML', () => {
  const programMsgs: Message[] = [
    {
      name: 'changed-html',
      contents: [
        {untranslatable: '<b>', index: 0},
        'Hello',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'changed-html',
      contents: [
        {untranslatable: '<blink>', index: 0},
        'Hola',
        {untranslatable: '</blink>', index: 1},
      ],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, [
    `Placeholder error in es-419 localization of changed-html: unexpected "<blink>"`,
    `Placeholder error in es-419 localization of changed-html: unexpected "</blink>"`,
    `Placeholder error in es-419 localization of changed-html: missing "<b>"`,
    `Placeholder error in es-419 localization of changed-html: missing "</b>"`,
  ]);
});

test('reordered placeholders', () => {
  const programMsgs: Message[] = [
    {
      name: 'reordered',
      contents: [
        {untranslatable: '<b>', index: 0},
        'Hello',
        {untranslatable: '</b>', index: 1},
        ' ',
        {untranslatable: '<i>', index: 2},
        'World',
        {untranslatable: '</i>', index: 3},
      ],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'reordered',
      contents: [
        {untranslatable: '<i>', index: 2},
        'Mundo',
        {untranslatable: '</i>', index: 3},
        ' ',
        {untranslatable: '<b>', index: 0},
        'Hola',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, []);
});

test('extra message not in source', () => {
  const programMsgs: Message[] = [
    {
      name: 'greeting',
      contents: ['Hello'],
    },
  ];
  const localizedMsgs: Message[] = [
    {
      name: 'greeting',
      contents: ['Hola'],
    },
    {
      name: 'deleted-message',
      contents: ['This message no longer exists'],
    },
  ];
  const errs = validateLocalizedPlaceholders(
    programMsgs,
    new Map([['es-419' as Locale, localizedMsgs]])
  );
  assert.deepStrictEqual(errs, []);
});
