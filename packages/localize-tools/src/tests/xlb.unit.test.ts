/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import {mkdtempSync, writeFileSync} from 'fs';
import {rmSync} from 'fs';
import {tmpdir} from 'os';
import path from 'path';
import type {Placeholder} from '../messages.js';
import {xlbFactory} from '../formatters/xlb.js';
import type {Config} from '../types/config.js';
import type {Locale} from '../types/locale.js';

/**
 * Create a minimal Config for testing the XLB formatter.
 */
function makeXlbConfig(
  baseDir: string,
  outputFile: string,
  translationsGlob: string
): Config {
  return {
    baseDir,
    sourceLocale: 'en' as Locale,
    targetLocales: ['es-419' as Locale],
    inputFiles: [],
    resolve: (p: string) => (path.isAbsolute(p) ? p : path.join(baseDir, p)),
    interchange: {
      format: 'xlb' as const,
      outputFile,
      translationsGlob,
    },
    output: {
      mode: 'runtime' as const,
      outputDir: 'out',
    },
  } as unknown as Config;
}

// ---------------------------------------------------------------------------
// TestParseXLB (via readTranslations)
// ---------------------------------------------------------------------------

test('parseXLB: string message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola Mundo</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles.length, 1);
    assert.strictEqual(bundles[0].locale, 'es-419');
    assert.strictEqual(bundles[0].messages.length, 1);
    assert.strictEqual(bundles[0].messages[0].name, 'greeting');
    assert.deepStrictEqual(bundles[0].messages[0].contents, ['Hola Mundo']);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: string message unnecessarily tagged with str', () => {
  // A str-tagged string with no expressions produces a plain text
  // translation in the XLB, identical to a plain string message.
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola Mundo</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.deepStrictEqual(bundles[0].messages[0].contents, ['Hola Mundo']);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: HTML message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola <ph name="0">&lt;b&gt;</ph>Mundo<ph name="1">&lt;/b&gt;</ph>!</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.strictEqual(msg.name, 'greeting');
    assert.deepStrictEqual(msg.contents, [
      'Hola ',
      {untranslatable: '<b>', index: 0} as Placeholder,
      'Mundo',
      {untranslatable: '</b>', index: 1} as Placeholder,
      '!',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: HTML message with comment', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola <ph name="0">&lt;b&gt;&lt;!-- comment --&gt;</ph>Mundo<ph name="1">&lt;/b&gt;</ph>!</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.deepStrictEqual(msg.contents, [
      'Hola ',
      {untranslatable: '<b><!-- comment -->', index: 0} as Placeholder,
      'Mundo',
      {untranslatable: '</b>', index: 1} as Placeholder,
      '!',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: parameterized string message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola <ph name="0">\${user}</ph>!</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.deepStrictEqual(msg.contents, [
      'Hola ',
      {untranslatable: '${user}', index: 0} as Placeholder,
      '!',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: parameterized HTML message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola <ph name="0">&lt;b&gt;\${user}&lt;/b&gt;</ph>!</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.deepStrictEqual(msg.contents, [
      'Hola ',
      {untranslatable: '<b>${user}</b>', index: 0} as Placeholder,
      '!',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: HTML message with expression and attribute', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="click_link">Clic <ph name="0">&lt;a href=&quot;\${url}&quot;&gt;</ph>aquí<ph name="1">&lt;/a&gt;</ph>!</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.strictEqual(msg.name, 'click_link');
    assert.deepStrictEqual(msg.contents, [
      'Clic ',
      {untranslatable: '<a href="${url}">', index: 0} as Placeholder,
      'aquí',
      {untranslatable: '</a>', index: 1} as Placeholder,
      '!',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: HTML message with nested msg expression', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="nested_msg">[SALT] Hola <ph name="0">&lt;b&gt;\${msg('World')}&lt;/b&gt;</ph>!</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.deepStrictEqual(msg.contents, [
      '[SALT] Hola ',
      {untranslatable: "<b>${msg('World')}</b>", index: 0} as Placeholder,
      '!',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: multiple messages', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola Mundo</msg>
    <msg name="farewell">Adiós Mundo</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].messages.length, 2);
    assert.strictEqual(bundles[0].messages[0].name, 'greeting');
    assert.strictEqual(bundles[0].messages[1].name, 'farewell');
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: placeholder index numbering', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="multi_ph"><ph name="0">&lt;b&gt;</ph>Hola<ph name="1">&lt;/b&gt;</ph> <ph name="2">&lt;i&gt;\${name}&lt;/i&gt;</ph></msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
    assert.deepStrictEqual(msg.contents, [
      {untranslatable: '<b>', index: 0} as Placeholder,
      'Hola',
      {untranslatable: '</b>', index: 1} as Placeholder,
      ' ',
      {untranslatable: '<i>${name}</i>', index: 2} as Placeholder,
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: text with special XML characters', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting">Hola &lt;Mundo&gt; &amp; &quot;Amigos&quot;</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.deepStrictEqual(bundles[0].messages[0].contents, [
      'Hola <Mundo> & "Amigos"',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: different locale', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="ja">
  <messages>
    <msg name="greeting">こんにちは世界</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'ja.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].locale, 'ja');
    assert.deepStrictEqual(bundles[0].messages[0].contents, ['こんにちは世界']);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: no messages', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].messages.length, 0);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLB: desc attribute is ignored during parsing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-test-'));
  try {
    const xlb = `<?xml version="1.0" encoding="UTF-8"?>
<localizationbundle locale="es-419">
  <messages>
    <msg name="greeting" desc="A greeting to Earth">Hola Mundo</msg>
  </messages>
</localizationbundle>`;
    writeFileSync(path.join(dir, 'es-419.xlb'), xlb, 'utf8');
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].messages[0].name, 'greeting');
    assert.deepStrictEqual(bundles[0].messages[0].contents, ['Hola Mundo']);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});
// ---------------------------------------------------------------------------
// TestFormatXLB (via writeOutput)
// ---------------------------------------------------------------------------
// In Go, FormatXLB is a standalone function that returns a string. In TS, the
// equivalent logic is inside XlbFormatter.writeOutput which writes to disk.
// We test by calling writeOutput and reading back the generated file.
//
// ProgramMessage requires ts.SourceFile and ts.Node, but writeOutput only
// accesses name, contents, and desc.

import type {ProgramMessage} from '../messages.js';

function makeProgramMessage(
  name: string,
  contents: Array<string | Placeholder>,
  desc?: string
): ProgramMessage {
  return {
    name,
    contents,
    desc,
    file: {} as never,
    node: {} as never,
    tag: undefined,
  } as ProgramMessage;
}

async function checkFormatXLB(
  msgs: ProgramMessage[],
  expectedSubstrings: string[]
) {
  const dir = mkdtempSync(path.join(tmpdir(), 'xlb-fmt-'));
  try {
    const cfg = makeXlbConfig(dir, 'en.xlb', '*.xlb');
    const formatter = xlbFactory(cfg);
    await formatter.writeOutput(msgs);
    const {readFileSync} = await import('fs');
    const got = readFileSync(path.join(dir, 'en.xlb'), 'utf8');
    for (const substr of expectedSubstrings) {
      assert.ok(
        got.includes(substr),
        `Expected output to contain "${substr}", got:\n${got}`
      );
    }
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

test('formatXLB: no messages', async () => {
  await checkFormatXLB(
    [],
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<localizationbundle locale="en">',
      '<messages>',
      '</messages>',
      '</localizationbundle>',
    ]
  );
});

test('formatXLB: string message', async () => {
  await checkFormatXLB(
    [makeProgramMessage('greeting', ['Hello World'])],
    ['<msg name="greeting">Hello World</msg>']
  );
});

test('formatXLB: HTML message', async () => {
  await checkFormatXLB(
    [
      makeProgramMessage('greeting', [
        {untranslatable: '<b>', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ]),
    ],
    ['<ph name="0">&lt;b&gt;</ph>Hello World<ph name="1">&lt;/b&gt;</ph>']
  );
});

test('formatXLB: HTML message with comment', async () => {
  await checkFormatXLB(
    [
      makeProgramMessage('greeting', [
        {untranslatable: '<b><!-- greeting -->', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ]),
    ],
    [
      '<ph name="0">&lt;b&gt;&lt;!-- greeting --&gt;</ph>Hello World<ph name="1">&lt;/b&gt;</ph>',
    ]
  );
});

test('formatXLB: parameterized string message', async () => {
  await checkFormatXLB(
    [
      makeProgramMessage('greeting', [
        'Hello ',
        {untranslatable: '${name}', index: 0},
      ]),
    ],
    ['Hello <ph name="0">${name}</ph>']
  );
});

test('formatXLB: desc option', async () => {
  await checkFormatXLB(
    [makeProgramMessage('greeting', ['Hello World'], 'A greeting to Earth')],
    ['<msg name="greeting" desc="A greeting to Earth">Hello World</msg>']
  );
});

test('formatXLB: multiple messages', async () => {
  await checkFormatXLB(
    [
      makeProgramMessage('greeting', ['Hello World']),
      makeProgramMessage('farewell', ['Goodbye World']),
    ],
    [
      '<msg name="greeting">Hello World</msg>',
      '<msg name="farewell">Goodbye World</msg>',
    ]
  );
});

test('formatXLB: placeholder index numbering', async () => {
  await checkFormatXLB(
    [
      makeProgramMessage('multi_ph', [
        {untranslatable: '<b>', index: 0},
        'Hello',
        {untranslatable: '</b>', index: 1},
        ' ',
        {untranslatable: '<i>${name}</i>', index: 2},
      ]),
    ],
    ['<ph name="0">', '<ph name="1">', '<ph name="2">']
  );
});
