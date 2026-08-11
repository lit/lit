/** @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {readConfigFileAndWriteSchema} from '../config.js';
import {test} from 'node:test';
import * as assert from 'node:assert';
import {mkdtempSync, writeFileSync, readFileSync} from 'fs';
import {tmpdir} from 'os';
import path from 'path';

function writeTestConfig(dir: string, content: string): string {
  const configPath = path.join(dir, 'lit-localize.json');
  writeFileSync(configPath, content, 'utf8');
  return configPath;
}

function makeTempDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'config-test-'));
}

// -- Valid config tests --

test('ValidXLBRuntime', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es-419', 'zh_CN'],
      inputFiles: ['src/**/*.ts'],
      tsConfig: 'tsconfig.json',
      interchange: {
        format: 'xlb',
        outputFile: 'data/en.xlb',
        translationsGlob: 'data/*.xlb',
      },
      output: {
        mode: 'runtime',
        language: 'ts',
        outputDir: 'out',
        localeCodesModule: 'src/locale-codes.ts',
      },
    })
  );

  const cfg = readConfigFileAndWriteSchema(configPath);

  assert.strictEqual(cfg.sourceLocale, 'en');
  assert.deepStrictEqual(cfg.targetLocales, ['es-419', 'zh_CN']);
  assert.deepStrictEqual(cfg.inputFiles, ['src/**/*.ts']);
  assert.strictEqual(cfg.tsConfig, 'tsconfig.json');
  assert.strictEqual(cfg.interchange.format, 'xlb');
  assert.strictEqual(
    (cfg.interchange as {outputFile: string}).outputFile,
    'data/en.xlb'
  );
  assert.strictEqual(
    (cfg.interchange as {translationsGlob: string}).translationsGlob,
    'data/*.xlb'
  );
  assert.strictEqual(cfg.output.mode, 'runtime');
  assert.strictEqual((cfg.output as {language: string}).language, 'ts');
  assert.strictEqual((cfg.output as {outputDir: string}).outputDir, 'out');
  assert.strictEqual(
    (cfg.output as {localeCodesModule: string}).localeCodesModule,
    'src/locale-codes.ts'
  );
  assert.strictEqual(cfg.baseDir, dir);
});

test('ValidXLIFFTransform', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['fr'],
      interchange: {
        format: 'xliff',
        xliffDir: 'xliff',
        placeholderStyle: 'ph',
      },
      output: {
        mode: 'transform',
        outputDir: 'build',
      },
    })
  );

  const cfg = readConfigFileAndWriteSchema(configPath);

  assert.strictEqual(cfg.interchange.format, 'xliff');
  assert.strictEqual((cfg.interchange as {xliffDir: string}).xliffDir, 'xliff');
  assert.strictEqual(
    (cfg.interchange as {placeholderStyle: string}).placeholderStyle,
    'ph'
  );
  assert.strictEqual(cfg.output.mode, 'transform');
  assert.strictEqual((cfg.output as {outputDir: string}).outputDir, 'build');
});

test('ValidWithPatches', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es-419'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {
        mode: 'runtime',
        outputDir: 'out',
      },
      patches: {
        'es-419': {
          greeting: [
            {
              before: 'Buenos dias',
              after: 'Buenos días',
            },
          ],
        },
      },
    })
  );

  const cfg = readConfigFileAndWriteSchema(configPath);

  assert.ok(cfg.patches);
  const localePatch = cfg.patches!['es-419'];
  assert.ok(localePatch);
  const msgPatches = localePatch['greeting'];
  assert.ok(msgPatches);
  assert.strictEqual(msgPatches.length, 1);
  assert.strictEqual(msgPatches[0].before, 'Buenos dias');
  assert.strictEqual(msgPatches[0].after, 'Buenos días');
});

// -- Error cases --

test('MissingFile', () => {
  assert.throws(
    () => readConfigFileAndWriteSchema('/nonexistent/path/lit-localize.json'),
    /could not read config file/i
  );
});

test('InvalidJSON', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(dir, '{not valid json}');

  assert.throws(
    () => readConfigFileAndWriteSchema(configPath),
    /invalid json/i
  );
});

test('MissingSourceLocale', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  assert.throws(
    () => readConfigFileAndWriteSchema(configPath),
    /sourceLocale/i
  );
});

test('MissingTargetLocales', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  assert.throws(
    () => readConfigFileAndWriteSchema(configPath),
    /targetLocales/i
  );
});

test('InvalidInterchangeFormat', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {format: 'invalid'},
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

test('MissingXLBFields', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {format: 'xlb'},
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

test('MissingXLIFFDir', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {format: 'xliff'},
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

test('InvalidOutputMode', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'invalid'},
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

test('MissingRuntimeOutputDir', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime'},
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

// -- Schema write tests --

test('WritesSchemaIfMissing', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  readConfigFileAndWriteSchema(configPath);

  const data = readFileSync(configPath, 'utf8');
  assert.ok(data.includes('$schema'));
  assert.ok(
    data.includes(
      'https://raw.githubusercontent.com/lit/lit/main/packages/localize-tools/config.schema.json'
    )
  );
});

test('PreservesExistingSchema', () => {
  const dir = makeTempDir();
  const customSchema = 'https://example.com/my-schema.json';
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      $schema: customSchema,
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  const cfg = readConfigFileAndWriteSchema(configPath);
  assert.strictEqual(cfg.$schema, customSchema);

  // Verify the file was not rewritten with the default schema.
  const data = readFileSync(configPath, 'utf8');
  assert.ok(
    !data.includes(
      'https://raw.githubusercontent.com/lit/lit/main/packages/localize-tools/config.schema.json'
    )
  );
});

// -- Resolve tests --

test('Resolve relative path', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  const cfg = readConfigFileAndWriteSchema(configPath);
  const got = cfg.resolve('src/foo.ts');
  const want = path.join(dir, 'src/foo.ts');
  assert.strictEqual(got, want);
});

test('Resolve absolute path', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
    })
  );

  const cfg = readConfigFileAndWriteSchema(configPath);
  const abs = '/absolute/path/foo.ts';
  const got = cfg.resolve(abs);
  assert.strictEqual(got, abs);
});

// -- Schema validation tests --

test('SchemaRejectsWrongType', () => {
  const dir = makeTempDir();
  // sourceLocale should be a string, not a number.
  const configPath = writeTestConfig(
    dir,
    `{
  "sourceLocale": 123,
  "targetLocales": ["es"],
  "interchange": {"format": "xlb", "outputFile": "en.xlb", "translationsGlob": "*.xlb"},
  "output": {"mode": "runtime", "outputDir": "out"}
}`
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

test('SchemaRejectsUnknownProperty', () => {
  const dir = makeTempDir();
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
      interchange: {
        format: 'xlb',
        outputFile: 'en.xlb',
        translationsGlob: '*.xlb',
      },
      output: {mode: 'runtime', outputDir: 'out'},
      unknownField: true,
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});

test('SchemaRejectsMissingRequired', () => {
  const dir = makeTempDir();
  // Missing both "interchange" and "output" which are required.
  const configPath = writeTestConfig(
    dir,
    JSON.stringify({
      sourceLocale: 'en',
      targetLocales: ['es'],
    })
  );

  assert.throws(() => readConfigFileAndWriteSchema(configPath));
});
