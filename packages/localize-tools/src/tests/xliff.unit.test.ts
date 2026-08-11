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
import {xliffFactory} from '../formatters/xliff.js';
import type {Config} from '../types/config.js';
import type {Locale} from '../types/locale.js';

/**
 * Create a minimal Config for testing the XLIFF formatter.
 */
function makeXliffConfig(
  baseDir: string,
  targetLocales: Locale[] = ['es-419' as Locale]
): Config {
  return {
    baseDir,
    sourceLocale: 'en' as Locale,
    targetLocales,
    inputFiles: [],
    resolve: (p: string) => (path.isAbsolute(p) ? p : path.join(baseDir, p)),
    interchange: {
      format: 'xliff' as const,
      xliffDir: '.',
    },
    output: {
      mode: 'runtime' as const,
      outputDir: 'out',
    },
  } as unknown as Config;
}

// ---------------------------------------------------------------------------
// TestParseXLIFF (via readTranslations)
// ---------------------------------------------------------------------------

test('parseXLIFF: string message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola Mundo</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
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

test('parseXLIFF: HTML message with x elements', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola <x id="0" equiv-text="&lt;b&gt;"/>Mundo<x id="1" equiv-text="&lt;/b&gt;"/>!</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
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

test('parseXLIFF: HTML message with comment', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola <x id="0" equiv-text="&lt;b&gt;&lt;!-- comment --&gt;"/>Mundo<x id="1" equiv-text="&lt;/b&gt;"/>!</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
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

test('parseXLIFF: parameterized string message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola <x id="0" equiv-text="\${user}"/>!</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
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

test('parseXLIFF: parameterized HTML message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola <x id="0" equiv-text="&lt;b&gt;\${user}&lt;/b&gt;"/>!</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
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

test('parseXLIFF: multiple messages', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola Mundo</target>
      </trans-unit>
      <trans-unit id="farewell">
        <target>Adiós Mundo</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].messages.length, 2);
    assert.strictEqual(bundles[0].messages[0].name, 'greeting');
    assert.strictEqual(bundles[0].messages[1].name, 'farewell');
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLIFF: trans-unit without target is skipped', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="translated">
        <target>Hola</target>
      </trans-unit>
      <trans-unit id="untranslated">
        <source>Hello</source>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].messages.length, 1);
    assert.strictEqual(bundles[0].messages[0].name, 'translated');
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLIFF: missing file returns empty bundles', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    // No XLIFF file written — the formatter should return empty bundles.
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles.length, 0);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLIFF: different locale', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="ja" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>こんにちは世界</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'ja.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir, ['ja' as Locale]);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.strictEqual(bundles[0].locale, 'ja');
    assert.deepStrictEqual(bundles[0].messages[0].contents, ['こんにちは世界']);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLIFF: text with special XML characters', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="greeting">
        <target>Hola &lt;Mundo&gt; &amp; &quot;Amigos&quot;</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    assert.deepStrictEqual(bundles[0].messages[0].contents, [
      'Hola <Mundo> & "Amigos"',
    ]);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('parseXLIFF: HTML message with expression and attribute', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-test-'));
  try {
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file target-language="es-419" source-language="en" original="lit-localize-inputs" datatype="plaintext">
    <body>
      <trans-unit id="click_link">
        <target>Clic <x id="0" equiv-text="&lt;a href=&quot;\${url}&quot;&gt;"/>aquí<x id="1" equiv-text="&lt;/a&gt;"/>!</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    writeFileSync(path.join(dir, 'es-419.xlf'), xliff, 'utf8');
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    const bundles = formatter.readTranslations();
    const msg = bundles[0].messages[0];
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
// ---------------------------------------------------------------------------
// TestFormatXLIFF (via writeOutput)
// ---------------------------------------------------------------------------
// In Go, FormatXLIFF is a standalone function that returns a string. In TS,
// the equivalent logic is inside XliffFormatter.writeOutput which writes to
// disk. We test by calling writeOutput and reading back the generated file.

import type {ProgramMessage, Message} from '../messages.js';

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

async function checkFormatXLIFF(
  msgs: ProgramMessage[],
  expectedSubstrings: string[],
  translations?: Map<Locale, Message[]>
) {
  const dir = mkdtempSync(path.join(tmpdir(), 'xliff-fmt-'));
  try {
    const cfg = makeXliffConfig(dir);
    const formatter = xliffFactory(cfg);
    await formatter.writeOutput(msgs, translations ?? new Map());
    const {readFileSync} = await import('fs');
    const got = readFileSync(path.join(dir, 'es-419.xlf'), 'utf8');
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

test('formatXLIFF: no messages', async () => {
  await checkFormatXLIFF(
    [],
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<xliff version="1.2"',
      'xmlns="urn:oasis:names:tc:xliff:document:1.2"',
      'target-language="es-419"',
      'source-language="en"',
      // xmldom serializes empty body as self-closing <body/>
      'body',
    ]
  );
});

test('formatXLIFF: string message', async () => {
  await checkFormatXLIFF(
    [makeProgramMessage('greeting', ['Hello World'])],
    ['<trans-unit id="greeting">', '<source>Hello World</source>']
  );
});

test('formatXLIFF: HTML message', async () => {
  await checkFormatXLIFF(
    [
      makeProgramMessage('greeting', [
        {untranslatable: '<b>', index: 0},
        'Hello World',
        {untranslatable: '</b>', index: 1},
      ]),
    ],
    [
      '<x id="0" equiv-text="&lt;b&gt;"/>',
      'Hello World',
      '<x id="1" equiv-text="&lt;/b&gt;"/>',
    ]
  );
});

test('formatXLIFF: parameterized string message', async () => {
  await checkFormatXLIFF(
    [
      makeProgramMessage('greeting', [
        'Hello ',
        {untranslatable: '${name}', index: 0},
      ]),
    ],
    ['<x id="0" equiv-text="${name}"/>']
  );
});

test('formatXLIFF: desc option', async () => {
  await checkFormatXLIFF(
    [makeProgramMessage('greeting', ['Hello World'], 'A greeting to Earth')],
    ['<note from="lit-localize">A greeting to Earth</note>']
  );
});

test('formatXLIFF: multiple messages', async () => {
  await checkFormatXLIFF(
    [
      makeProgramMessage('greeting', ['Hello World']),
      makeProgramMessage('farewell', ['Goodbye World']),
    ],
    ['<trans-unit id="greeting">', '<trans-unit id="farewell">']
  );
});

test('formatXLIFF: with existing translations', async () => {
  const translations = new Map<Locale, Message[]>([
    ['es-419' as Locale, [{name: 'greeting', contents: ['Hola Mundo']}]],
  ]);
  await checkFormatXLIFF(
    [makeProgramMessage('greeting', ['Hello World'])],
    ['<source>Hello World</source>', '<target>Hola Mundo</target>'],
    translations
  );
});

test('formatXLIFF: placeholder index numbering', async () => {
  await checkFormatXLIFF(
    [
      makeProgramMessage('multi_ph', [
        {untranslatable: '<b>', index: 0},
        'Hello',
        {untranslatable: '</b>', index: 1},
        ' ',
        {untranslatable: '<i>${name}</i>', index: 2},
      ]),
    ],
    ['<x id="0"', '<x id="1"', '<x id="2"']
  );
});
