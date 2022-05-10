/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {writeFileTree, javascript} from '../lib/file-utils.js';
import {assert} from 'console';

const writeFileTreeTest = suite<{outputFolder: string}>('writeFileTree');

writeFileTreeTest.before((ctx) => {
  // TODO(kschaaf): Use FilesystemTestRig once moved into test utils
  ctx.outputFolder = fs.mkdtempSync(os.tmpdir());
});

writeFileTreeTest.after(({outputFolder}) => {
  fs.rmSync(outputFolder, {recursive: true});
});

writeFileTreeTest('top-level files', async ({outputFolder}) => {
  await writeFileTree(outputFolder, {
    foo: 'content: foo',
    'bar.js': 'content: bar.js',
  });
  assert(
    String(fs.readFileSync(path.join(outputFolder, 'foo'))) === 'content foo'
  );
  assert(
    String(fs.readFileSync(path.join(outputFolder, 'bar.js'))) ===
      'content bar.js'
  );
});

writeFileTreeTest('files in folders', async ({outputFolder}) => {
  await writeFileTree(outputFolder, {
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
  });
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
        path.join(outputFolder, 'dir1/dir2/dir3/some-really_long.filename.js')
      )
    ) === 'content: some-really_long.filename.js'
  );
});

writeFileTreeTest('filenames containing folders', async ({outputFolder}) => {
  await writeFileTree(outputFolder, {
    'file/with/dir/baz.js': 'content: baz.js',
    dir3: {
      'file/in/dir3/zot.js': 'content zot.js',
    },
  });

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

writeFileTreeTest.run();

const javascriptTest = suite('javascript tag');

javascriptTest('string interoplation', () => {
  assert(javascript`foo=${'bar'};\nbaz=${'zot'};` === 'foo=bar;\baz=zot;');
});

javascriptTest('nested interpolation', () => {
  assert(javascript`foo=${javascript`(bar=${'zot'})`}` === 'foo=(bar=zot)');
});

javascriptTest('array interpolation', () => {
  const arr = [
    ['a1', 'a2'],
    ['b1', 'b2'],
    ['c1', 'c2'],
  ];
  assert(javascript`foo=${arr.map((arr2) => arr2[0])};` === 'foo=a1a2a3;');
  assert(
    javascript`foo=1${arr.map((arr2) =>
      arr2.map((i) => javascript`*${i}`)
    )};` === 'foo=1*a1*a2*b1*b2*c1*c2;'
  );
});

javascriptTest.run();
