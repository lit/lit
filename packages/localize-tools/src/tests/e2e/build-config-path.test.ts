/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'node:test';
import * as assert from 'node:assert';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'fs';
import {tmpdir} from 'os';
import * as path from 'path';
import {runAndLog} from '../../cli.js';

for (const mode of ['runtime', 'transform']) {
  for (const absolute of [false, true]) {
    test(`${mode} build resolves ${absolute ? 'absolute' : 'relative'} localeCodesModule with a nested config`, async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'localize-config-path-'));
      const oldCwd = process.cwd();
      const clientDir = path.join(dir, 'client');
      const modulePath = path.join(clientDir, 'generated', 'locale-codes.ts');
      try {
        mkdirSync(clientDir);
        writeFileSync(
          path.join(clientDir, 'input.js'),
          'export const greeting = "Hello";'
        );
        writeFileSync(
          path.join(clientDir, 'lit-localize.json'),
          JSON.stringify({
            sourceLocale: 'en',
            targetLocales: ['es'],
            inputFiles: ['input.js'],
            output: {
              mode,
              outputDir: './output',
              localeCodesModule: absolute
                ? modulePath
                : './generated/locale-codes.ts',
            },
            interchange: {format: 'xliff', xliffDir: './xliff'},
          })
        );
        process.chdir(dir);
        assert.strictEqual(
          await runAndLog([
            'node',
            'lit-localize',
            '--config=client/lit-localize.json',
            'build',
          ]),
          0
        );
        assert.ok(
          existsSync(modulePath),
          'locale codes module is relative to the config'
        );
        const source = readFileSync(modulePath, 'utf8');
        assert.ok(source.includes('export const sourceLocale = `en`;'));
        assert.ok(source.includes('`es`'));
        assert.ok(!existsSync(path.join(dir, 'generated', 'locale-codes.ts')));
      } finally {
        process.chdir(oldCwd);
        rmSync(dir, {recursive: true, force: true});
      }
    });
  }
}
