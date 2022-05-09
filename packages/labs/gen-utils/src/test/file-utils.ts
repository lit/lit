/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test, suite} from 'uvu';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import {writeFileTree, javascript} from '../lib/file-utils.js';
import {assert} from 'console';

let outputFolder: string;

suite('writeFileTree basic', async () => {
  test.before(() => {
    outputFolder = fs.mkdtempSync(os.tmpdir());
  });

  test.after(() => {
    fs.rmSync(outputFolder, {recursive: true});
  });

  test('writeFileTree', async () => {
    writeFileTree(outputFolder, {
      foo: 'content: foo',
      'bar.js': 'content: bar.js',
      dir1: {
        foo1: 'content: foo1',
        'bar1.js': 'content: bar1.js',
        dir2: {
          dir3: {
            'some-really_long.filename.js':
              'content: some-really_long.filename.js',
          },
        },
      },
      'file/with/dir/baz.js': 'content: baz.js',
      dir3: {
        'file/in/dir3/zot.js': 'content zot.js',
      },
    });
  });

  assert(
    String(fs.readFileSync(path.join(outputFolder, 'foo'))) === 'content foo'
  );
  assert(
    String(fs.readFileSync(path.join(outputFolder, 'bar.js'))) ===
      'content bar.js'
  );
  assert(
    String(fs.readFileSync(path.join(outputFolder, 'dir1/foo1'))) ===
      'content foo1'
  );
  assert(
    String(fs.readFileSync(path.join(outputFolder, 'dir1/bar1.js'))) ===
      'content bar1.js'
  );
  assert(
    String(
      fs.readFileSync(
        path.join(outputFolder, 'dir2/dir3/some-really_long.filename.js')
      )
    ) === 'content: some-really_long.filename.js'
  );
  assert(
    String(fs.readFileSync(path.join(outputFolder, 'file/with/dir/baz.js'))) ===
      'content: baz.js'
  );
  assert(
    String(
      fs.readFileSync(path.join(outputFolder, 'dir3/file/in/dir3/zot.js'))
    ) === 'content: zot.js'
  );
});

test.run();
