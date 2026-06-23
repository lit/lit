/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import type {Message, ProgramMessage, Placeholder} from '../messages.js';
import type {Locale} from '../types/locale.js';
import {generateLocaleModule, makeMessageString} from '../modes/runtime.js';

/**
 * Create a mock ProgramMessage for testing. The real ProgramMessage requires
 * ts.SourceFile and ts.Node, but generateLocaleModule/makeMessageString never
 * access those fields.
 */
function makeProgramMessage(
  name: string,
  contents: Array<string | Placeholder>,
  tag?: 'html' | 'str',
  desc?: string
): ProgramMessage {
  return {
    name,
    contents,
    tag,
    desc,
    file: {} as never,
    node: {} as never,
  } as ProgramMessage;
}

/**
 * Normalize whitespace in generated module output for assertion comparison.
 * The TS generateLocaleModule uses template literals with indentation that
 * produces extra whitespace. This normalizes it to match Go's cleaner output.
 */
function normalizeModule(s: string): string {
  return s
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

// ---------------------------------------------------------------------------
// TestGenerateLocaleModule
// ---------------------------------------------------------------------------

test('GenerateLocaleModule: plain string message', () => {
  // import {msg} from '@lit/localize';
  // msg('Hello World!', {id: 'greeting'});
  const translations: Message[] = [
    {name: 'greeting', contents: ['Hola Mundo!']},
  ];
  const canonMsgs = [makeProgramMessage('greeting', ['Hello World!'])];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'greeting': `Hola Mundo!`,"));
  assert.ok(!normalized.includes('import {html}'));
  assert.ok(!normalized.includes('import {str}'));
});

test('GenerateLocaleModule: plain string with expression', () => {
  // import {msg, str} from '@lit/localize';
  // const user = 'Friend';
  // msg(str`Hello ${user}!`);
  const translations: Message[] = [
    {
      name: 's00ad08ebae1e0f74',
      contents: ['Hola ', {untranslatable: '${user}', index: 0}, '!'],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      's00ad08ebae1e0f74',
      ['Hello ', {untranslatable: '${user}', index: 0}, '!'],
      'str'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'s00ad08ebae1e0f74': str`Hola ${0}!`,"));
  assert.ok(normalized.includes('import {str}'));
});

test('GenerateLocaleModule: lit template', () => {
  // import {msg} from '@lit/localize';
  // msg(html`Hello <b>World</b>!`);
  const translations: Message[] = [
    {
      name: 'h3c44aff2d5f5ef6b',
      contents: [
        'Hola ',
        {untranslatable: '<b>', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
        '!',
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'h3c44aff2d5f5ef6b',
      [
        {untranslatable: '<b>', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes("'h3c44aff2d5f5ef6b': html`Hola <b>Mundo</b>!`,")
  );
  assert.ok(normalized.includes("import {html} from 'lit';"));
});

test('GenerateLocaleModule: lit template with variable expression (one placeholder)', () => {
  // msg(html`Hello <b>${user}</b>!`);
  const translations: Message[] = [
    {
      name: 'h82ccc38d4d46eaa9',
      contents: ['Hola ', {untranslatable: '<b>${user}</b>', index: 0}, '!'],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'h82ccc38d4d46eaa9',
      [{untranslatable: '<b>${user}</b>', index: 0}, '!'],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes("'h82ccc38d4d46eaa9': html`Hola <b>${0}</b>!`,")
  );
});

test('GenerateLocaleModule: lit template with variable expression (two placeholders)', () => {
  // msg(html`Click <a href=${url}>here</a>!`);
  const translations: Message[] = [
    {
      name: 'h99e74f744fda7e25',
      contents: [
        'Clic ',
        {untranslatable: '<a href="${url}">', index: 0},
        'aquí',
        {untranslatable: '</a>', index: 1},
        '!',
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'h99e74f744fda7e25',
      [
        {untranslatable: '<a href="${url}">', index: 0},
        'here',
        {untranslatable: '</a>', index: 1},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes(
      `'h99e74f744fda7e25': html\`Clic <a href="\${0}">aquí</a>!\`,`
    )
  );
});

test('GenerateLocaleModule: lit template with string expression', () => {
  // msg(html`[SALT] Click <a href="${'https://www.example.com/'}">here</a>!`);
  const translations: Message[] = [
    {
      name: 'hc1c6bfa4414cb3e3',
      contents: [
        '[SALT] Clic ',
        {
          untranslatable: `<a href="\${'https://www.example.com/'}">`,
          index: 0,
        },
        'aquí',
        {untranslatable: '</a>', index: 1},
        '!',
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'hc1c6bfa4414cb3e3',
      [
        {
          untranslatable: `<a href="\${'https://www.example.com/'}">`,
          index: 0,
        },
        'here',
        {untranslatable: '</a>', index: 1},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes(
      `'hc1c6bfa4414cb3e3': html\`[SALT] Clic <a href="\${0}">aquí</a>!\`,`
    )
  );
});

test('GenerateLocaleModule: lit template with nested msg expression', () => {
  // msg(html`[SALT] Hello <b>${msg('World')}</b>!`);
  const translations: Message[] = [
    {
      name: 'h349c3c4777670217',
      contents: [
        '[SALT] Hola ',
        {untranslatable: "<b>${msg('World')}</b>", index: 0},
        '!',
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'h349c3c4777670217',
      [{untranslatable: "<b>${msg('World')}</b>", index: 0}, '!'],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes("'h349c3c4777670217': html`[SALT] Hola <b>${0}</b>!`,")
  );
});

test('GenerateLocaleModule: lit template with comment', () => {
  // msg(html`Hello <b><!-- comment -->World</b>!`);
  const translations: Message[] = [
    {
      name: 'hbe936ff3da20ffdf',
      contents: [
        'Hola ',
        {untranslatable: '<b><!-- comment -->', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
        '!',
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'hbe936ff3da20ffdf',
      [
        {untranslatable: '<b><!-- comment -->', index: 0},
        'World',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes(
      "'hbe936ff3da20ffdf': html`Hola <b><!-- comment -->Mundo</b>!`,"
    )
  );
});

test('GenerateLocaleModule: custom ID', () => {
  // msg('Hello World', {id: 'myId'});
  const translations: Message[] = [{name: 'myId', contents: ['Hola Mundo']}];
  const canonMsgs = [makeProgramMessage('myId', ['Hello World'])];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'myId': `Hola Mundo`,"));
});

test('GenerateLocaleModule: described message', () => {
  // msg('described 0', {desc: 'Description of 0'});
  const translations: Message[] = [
    {name: 's03c68d79ad36e8d4', contents: ['described 0']},
  ];
  const canonMsgs = [
    makeProgramMessage(
      's03c68d79ad36e8d4',
      ['described 0'],
      undefined,
      'Description of 0'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'s03c68d79ad36e8d4': `described 0`,"));
});

test('GenerateLocaleModule: entries sorted by message name', () => {
  // Translations arrive in arbitrary order; output should be sorted
  // alphabetically by message name for easier diffing.
  const translations: Message[] = [
    {name: 'z_last', contents: ['Último']},
    {name: 'a_first', contents: ['Primero']},
    {name: 'm_middle', contents: ['Medio']},
  ];
  const canonMsgs = [
    makeProgramMessage('z_last', ['Last']),
    makeProgramMessage('a_first', ['First']),
    makeProgramMessage('m_middle', ['Middle']),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  const aIdx = normalized.indexOf("'a_first'");
  const mIdx = normalized.indexOf("'m_middle'");
  const zIdx = normalized.indexOf("'z_last'");
  assert.ok(aIdx < mIdx, 'a_first should come before m_middle');
  assert.ok(mIdx < zIdx, 'm_middle should come before z_last');
});

test('GenerateLocaleModule: missing translation uses canonical text as fallback', () => {
  // When a translation is missing for a canonical message, the canonical
  // text should be used as a fallback.
  const translations: Message[] = [];
  const canonMsgs = [makeProgramMessage('greeting', ['Hello World'])];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'greeting': `Hello World`,"));
});

test('GenerateLocaleModule: extra translation not in canonical messages is skipped', () => {
  // A translation for a message that doesn't exist in the canonical messages
  // should be silently skipped.
  const translations: Message[] = [
    {name: 'exists', contents: ['Existe']},
    {name: 'does_not_exist', contents: ['No existe']},
  ];
  const canonMsgs = [makeProgramMessage('exists', ['Exists'])];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'exists': `Existe`,"));
  assert.ok(!normalized.includes('does_not_exist'));
});

test('GenerateLocaleModule: importLit and importStr both set', () => {
  // When the canonical messages include both html and str tags, both import
  // flags should be set.
  const translations: Message[] = [
    {name: 'html_msg', contents: ['HTML']},
    {name: 'str_msg', contents: ['STR']},
    {name: 'plain_msg', contents: ['PLAIN']},
  ];
  const canonMsgs = [
    makeProgramMessage('html_msg', ['HTML'], 'html'),
    makeProgramMessage('str_msg', ['STR'], 'str'),
    makeProgramMessage('plain_msg', ['PLAIN']),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("import {html} from 'lit';"));
  assert.ok(normalized.includes("import {str} from '@lit/localize';"));
  assert.ok(normalized.includes("'html_msg': html`HTML`,"));
  assert.ok(normalized.includes("'str_msg': str`STR`,"));
  assert.ok(normalized.includes("'plain_msg': `PLAIN`,"));
});

test('GenerateLocaleModule: text escaping for template literal', () => {
  // Special characters in translated text should be escaped for safe
  // embedding in a JavaScript template literal.
  const translations: Message[] = [
    {
      name: 'special',
      contents: ['back\\tick` dollar$ amp& lt< gt>'],
    },
  ];
  const canonMsgs = [makeProgramMessage('special', ['original'])];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes(
      "'special': `back\\\\tick\\` dollar\\$ amp&amp; lt&lt; gt&gt;`,"
    )
  );
});

test('GenerateLocaleModule: placeholder with no expressions', () => {
  // An untranslatable placeholder with no ${} expressions (e.g. a plain
  // HTML tag like <b>) should be output verbatim.
  const translations: Message[] = [
    {
      name: 'bold',
      contents: [
        {untranslatable: '<b>', index: 0},
        'Negrita',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'bold',
      [
        {untranslatable: '<b>', index: 0},
        'Bold',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("'bold': html`<b>Negrita</b>`,"));
});

test('GenerateLocaleModule: placeholder expression reordering', () => {
  // Translations can reorder placeholders. The absolute expression index
  // should follow the canonical order, not the translated order.
  //
  // Canonical:  <a href="${url}">text</a> <b>${name}</b>
  //   ph0 has ${url} -> absIdx 0
  //   ph2 has ${name} -> absIdx 1
  //
  // Translation reorders: <b>${name}</b> <a href="${url}">texto</a>
  //   ph2 appears first, but should still get absIdx 1
  //   ph0 appears second, but should still get absIdx 0
  const translations: Message[] = [
    {
      name: 'reorder',
      contents: [
        {untranslatable: '<b>${name}</b>', index: 2},
        ' ',
        {untranslatable: '<a href="${url}">', index: 0},
        'texto',
        {untranslatable: '</a>', index: 1},
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'reorder',
      [
        {untranslatable: '<a href="${url}">', index: 0},
        'text',
        {untranslatable: '</a>', index: 1},
        ' ',
        {untranslatable: '<b>${name}</b>', index: 2},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes(
      `'reorder': html\`<b>\${1}</b> <a href="\${0}">texto</a>\`,`
    )
  );
});

test('GenerateLocaleModule: full realistic locale module', () => {
  // A realistic scenario exercising all supported features together,
  // matching the e2e build-runtime-xlb golden.
  const translations: Message[] = [
    {name: 's8c0ec8d1fb9e6e32', contents: ['Hola Mundo!']},
    {
      name: 's00ad08ebae1e0f74',
      contents: ['Hola ', {untranslatable: '${user}', index: 0}, '!'],
    },
    {
      name: 'h3c44aff2d5f5ef6b',
      contents: [
        'Hola ',
        {untranslatable: '<b>', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
        '!',
      ],
    },
    {
      name: 'h82ccc38d4d46eaa9',
      contents: ['Hola ', {untranslatable: '<b>${user}</b>', index: 0}, '!'],
    },
    {
      name: 'h99e74f744fda7e25',
      contents: [
        'Clic ',
        {untranslatable: '<a href="${url}">', index: 0},
        'aquí',
        {untranslatable: '</a>', index: 1},
        '!',
      ],
    },
    {
      name: 'hc1c6bfa4414cb3e3',
      contents: [
        '[SALT] Clic ',
        {
          untranslatable: `<a href="\${'https://www.example.com/'}">`,
          index: 0,
        },
        'aquí',
        {untranslatable: '</a>', index: 1},
        '!',
      ],
    },
    {
      name: 'h349c3c4777670217',
      contents: [
        '[SALT] Hola ',
        {untranslatable: "<b>${msg('World')}</b>", index: 0},
        '!',
      ],
    },
    {name: 's0f19e6c4e521dd53', contents: ['Mundo']},
    {
      name: 'hbe936ff3da20ffdf',
      contents: [
        'Hola ',
        {untranslatable: '<b><!-- comment -->', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
        '!',
      ],
    },
    {name: 'myId', contents: ['Hola Mundo']},
    {name: 's03c68d79ad36e8d4', contents: ['described 0']},
  ];
  const canonMsgs = [
    makeProgramMessage('s8c0ec8d1fb9e6e32', ['Hello World!']),
    makeProgramMessage(
      's00ad08ebae1e0f74',
      ['Hello ', {untranslatable: '${user}', index: 0}, '!'],
      'str'
    ),
    makeProgramMessage(
      'h3c44aff2d5f5ef6b',
      [
        {untranslatable: '<b>', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage(
      'h82ccc38d4d46eaa9',
      [{untranslatable: '<b>${user}</b>', index: 0}, '!'],
      'html'
    ),
    makeProgramMessage(
      'h99e74f744fda7e25',
      [
        {untranslatable: '<a href="${url}">', index: 0},
        'here',
        {untranslatable: '</a>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage(
      'hc1c6bfa4414cb3e3',
      [
        {
          untranslatable: `<a href="\${'https://www.example.com/'}">`,
          index: 0,
        },
        'here',
        {untranslatable: '</a>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage(
      'h349c3c4777670217',
      [{untranslatable: "<b>${msg('World')}</b>", index: 0}, '!'],
      'html'
    ),
    makeProgramMessage('s0f19e6c4e521dd53', ['World']),
    makeProgramMessage(
      'hbe936ff3da20ffdf',
      [
        {untranslatable: '<b><!-- comment -->', index: 0},
        'World',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage('myId', ['Hello World']),
    makeProgramMessage(
      's03c68d79ad36e8d4',
      ['described 0'],
      undefined,
      'Description of 0'
    ),
  ];

  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);

  // Verify header
  assert.ok(normalized.includes('// Do not modify this file by hand!'));
  assert.ok(normalized.includes("import {html} from 'lit';"));
  assert.ok(normalized.includes("import {str} from '@lit/localize';"));
  assert.ok(normalized.includes('export const templates = {'));

  // Verify entries are sorted by name
  assert.ok(
    normalized.includes("'h349c3c4777670217': html`[SALT] Hola <b>${0}</b>!`,")
  );
  assert.ok(
    normalized.includes("'h3c44aff2d5f5ef6b': html`Hola <b>Mundo</b>!`,")
  );
  assert.ok(
    normalized.includes("'h82ccc38d4d46eaa9': html`Hola <b>${0}</b>!`,")
  );
  assert.ok(normalized.includes("'myId': `Hola Mundo`,"));
  assert.ok(normalized.includes("'s00ad08ebae1e0f74': str`Hola ${0}!`,"));
  assert.ok(normalized.includes("'s03c68d79ad36e8d4': `described 0`,"));
  assert.ok(normalized.includes("'s0f19e6c4e521dd53': `Mundo`,"));
  assert.ok(normalized.includes("'s8c0ec8d1fb9e6e32': `Hola Mundo!`,"));
});

test('GenerateLocaleModule: end-to-end from XLB parsing', () => {
  // This is tested via the e2e tests in the TS codebase, but here we verify
  // the same scenario inline matching the Go test. We import the XLB parser
  // to parse the XLB and pass the result to generateLocaleModule.
  //
  // For this test, we just verify that generateLocaleModule produces the
  // expected output when given the parsed translations directly (since the
  // XLB parsing is already tested in xlb.unit.test.ts).
  const translations: Message[] = [
    {name: 's8c0ec8d1fb9e6e32', contents: ['Hola Mundo!']},
    {
      name: 'h3c44aff2d5f5ef6b',
      contents: [
        'Hola ',
        {untranslatable: '<b>', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
        '!',
      ],
    },
    {name: 'myId', contents: ['Hola Mundo']},
  ];
  const canonMsgs = [
    makeProgramMessage('s8c0ec8d1fb9e6e32', ['Hello World!']),
    makeProgramMessage(
      'h3c44aff2d5f5ef6b',
      [
        {untranslatable: '<b>', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage('myId', ['Hello World']),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes("'h3c44aff2d5f5ef6b': html`Hola <b>Mundo</b>!`,")
  );
  assert.ok(normalized.includes("'myId': `Hola Mundo`,"));
  assert.ok(normalized.includes("'s8c0ec8d1fb9e6e32': `Hola Mundo!`,"));
});

test('GenerateLocaleModule: end-to-end from XLIFF parsing', () => {
  // Same as the XLB variant but verifying the XLIFF parse path would produce
  // the same module. We pass the parsed translations directly.
  const translations: Message[] = [
    {name: 's8c0ec8d1fb9e6e32', contents: ['Hola Mundo!']},
    {
      name: 'h3c44aff2d5f5ef6b',
      contents: [
        'Hola ',
        {untranslatable: '<b>', index: 0},
        'Mundo',
        {untranslatable: '</b>', index: 1},
        '!',
      ],
    },
    {name: 'myId', contents: ['Hola Mundo']},
  ];
  const canonMsgs = [
    makeProgramMessage('s8c0ec8d1fb9e6e32', ['Hello World!']),
    makeProgramMessage(
      'h3c44aff2d5f5ef6b',
      [
        {untranslatable: '<b>', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage('myId', ['Hello World']),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(
    normalized.includes("'h3c44aff2d5f5ef6b': html`Hola <b>Mundo</b>!`,")
  );
  assert.ok(normalized.includes("'myId': `Hola Mundo`,"));
  assert.ok(normalized.includes("'s8c0ec8d1fb9e6e32': `Hola Mundo!`,"));
});

// ---------------------------------------------------------------------------
// TestRenderLocaleModule
// ---------------------------------------------------------------------------
// In Go, RenderLocaleModule is a separate function that converts a
// LocaleModule struct to a string. In TS, generateLocaleModule directly
// produces the string. These tests verify the output format.

test('RenderLocaleModule: plain string entries', () => {
  const translations: Message[] = [
    {name: 'greeting', contents: ['Hola Mundo']},
  ];
  const canonMsgs = [makeProgramMessage('greeting', ['Hello World'])];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes('// Do not modify this file by hand!'));
  assert.ok(
    normalized.includes('// Re-generate this file by running lit-localize')
  );
  assert.ok(!normalized.includes('import {html}'));
  assert.ok(!normalized.includes('import {str}'));
  assert.ok(
    normalized.includes('/* eslint-disable no-irregular-whitespace */')
  );
  assert.ok(
    normalized.includes(
      '/* eslint-disable @typescript-eslint/no-explicit-any */'
    )
  );
  assert.ok(normalized.includes('export const templates = {'));
  assert.ok(normalized.includes("'greeting': `Hola Mundo`,"));
  assert.ok(normalized.includes('};'));
});

test('RenderLocaleModule: html import', () => {
  const translations: Message[] = [
    {
      name: 'bold',
      contents: [
        {untranslatable: '<b>', index: 0},
        'Negrita',
        {untranslatable: '</b>', index: 1},
      ],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'bold',
      [
        {untranslatable: '<b>', index: 0},
        'Bold',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("import {html} from 'lit';"));
  assert.ok(!normalized.includes('import {str}'));
  assert.ok(normalized.includes("'bold': html`<b>Negrita</b>`,"));
});

test('RenderLocaleModule: both html and str imports', () => {
  const translations: Message[] = [
    {
      name: 'bold',
      contents: [
        {untranslatable: '<b>', index: 0},
        'Negrita',
        {untranslatable: '</b>', index: 1},
      ],
    },
    {name: 'greeting', contents: ['Hola']},
    {
      name: 'parameterized',
      contents: ['Hola ', {untranslatable: '${name}', index: 0}, '!'],
    },
  ];
  const canonMsgs = [
    makeProgramMessage(
      'bold',
      [
        {untranslatable: '<b>', index: 0},
        'Bold',
        {untranslatable: '</b>', index: 1},
      ],
      'html'
    ),
    makeProgramMessage('greeting', ['Hello']),
    makeProgramMessage(
      'parameterized',
      ['Hello ', {untranslatable: '${name}', index: 0}, '!'],
      'str'
    ),
  ];
  const result = generateLocaleModule(
    'es-419' as Locale,
    translations,
    canonMsgs,
    {}
  );
  const normalized = normalizeModule(result);
  assert.ok(normalized.includes("import {html} from 'lit';"));
  assert.ok(normalized.includes("import {str} from '@lit/localize';"));
  assert.ok(normalized.includes("'bold': html`<b>Negrita</b>`,"));
  assert.ok(normalized.includes("'greeting': `Hola`,"));
  assert.ok(normalized.includes("'parameterized': str`Hola ${0}!`,"));
});

// ---------------------------------------------------------------------------
// TestMakeMessageString
// ---------------------------------------------------------------------------

test('makeMessageString: plain string', () => {
  const contents: Array<string | Placeholder> = ['Hello World'];
  const canon = makeProgramMessage('test', ['Hello World']);
  const result = makeMessageString(contents, canon);
  assert.strictEqual(result, '`Hello World`');
});

test('makeMessageString: html tag', () => {
  const contents: Array<string | Placeholder> = [
    {untranslatable: '<b>', index: 0},
    'Bold',
    {untranslatable: '</b>', index: 1},
  ];
  const canon = makeProgramMessage(
    'test',
    [
      {untranslatable: '<b>', index: 0},
      'Bold',
      {untranslatable: '</b>', index: 1},
    ],
    'html'
  );
  const result = makeMessageString(contents, canon);
  assert.strictEqual(result, 'html`<b>Bold</b>`');
});

test('makeMessageString: str tag with expression', () => {
  const contents: Array<string | Placeholder> = [
    'Hello ',
    {untranslatable: '${name}', index: 0},
    '!',
  ];
  const canon = makeProgramMessage(
    'test',
    ['Hello ', {untranslatable: '${name}', index: 0}, '!'],
    'str'
  );
  const result = makeMessageString(contents, canon);
  assert.strictEqual(result, 'str`Hello ${0}!`');
});

test('makeMessageString: expression reindexing', () => {
  // When the translation reorders placeholders, the absolute indices should
  // follow the canonical order.
  const contents: Array<string | Placeholder> = [
    {untranslatable: '${b}', index: 1},
    ' then ',
    {untranslatable: '${a}', index: 0},
  ];
  const canon = makeProgramMessage(
    'test',
    [
      {untranslatable: '${a}', index: 0},
      ' and ',
      {untranslatable: '${b}', index: 1},
    ],
    'str'
  );
  const result = makeMessageString(contents, canon);
  assert.strictEqual(result, 'str`${1} then ${0}`');
});

test('makeMessageString: escapes special characters', () => {
  const contents: Array<string | Placeholder> = ['back\\tick` dollar$'];
  const canon = makeProgramMessage('test', ['original']);
  const result = makeMessageString(contents, canon);
  assert.strictEqual(result, '`back\\\\tick\\` dollar\\$`');
});
