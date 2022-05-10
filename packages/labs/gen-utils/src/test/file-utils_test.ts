/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {writeFileTree, javascript} from '../lib/file-utils.js';

const writeFileTreeTest = suite<{outputFolder: string}>('writeFileTree');

writeFileTreeTest.before((ctx) => {
  // TODO(kschaaf): Use FilesystemTestRig once moved into test utils
  ctx.outputFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'writeFileTest-'));
  if (!ctx.outputFolder) {
    throw new Error(`Failed to create temp dir under ${os.tmpdir()}`);
  }
});

writeFileTreeTest.after(({outputFolder}) => {
  fs.rmSync(outputFolder, {recursive: true});
});

writeFileTreeTest('top-level files', async ({outputFolder}) => {
  await writeFileTree(outputFolder, {
    foo: 'foo',
    'bar.js': 'bar.js',
  });
  assert.equal(String(fs.readFileSync(path.join(outputFolder, 'foo'))), 'foo');
  assert.equal(
    String(fs.readFileSync(path.join(outputFolder, 'bar.js'))),
    'bar.js'
  );
});

writeFileTreeTest('files in folders', async ({outputFolder}) => {
  await writeFileTree(outputFolder, {
    dir1: {
      foo1: 'foo1',
      'bar1.js': 'bar1.js',
      dir2: {
        dir3: {
          'some-really_long.filename.js': 'some-really_long.filename.js',
        },
      },
    },
  });
  assert.equal(
    String(fs.readFileSync(path.join(outputFolder, 'dir1/foo1'))),
    'foo1'
  );
  assert.equal(
    String(fs.readFileSync(path.join(outputFolder, 'dir1/bar1.js'))),
    'bar1.js'
  );
  assert.equal(
    String(
      fs.readFileSync(
        path.join(outputFolder, 'dir1/dir2/dir3/some-really_long.filename.js')
      )
    ),
    'some-really_long.filename.js'
  );
});

writeFileTreeTest('filenames containing folders', async ({outputFolder}) => {
  await writeFileTree(outputFolder, {
    'file/with/dir/baz.js': 'baz.js',
    dir3: {
      'file/in/dir3/zot.js': 'zot.js',
    },
  });

  assert.equal(
    String(fs.readFileSync(path.join(outputFolder, 'file/with/dir/baz.js'))),
    'baz.js'
  );
  assert.equal(
    String(
      fs.readFileSync(path.join(outputFolder, 'dir3/file/in/dir3/zot.js'))
    ),
    'zot.js'
  );
});

writeFileTreeTest.run();

const javascriptTest = suite('javascript tag');

javascriptTest('string interoplation', () => {
  assert.equal(javascript`foo=${'bar'};\nbaz=${'zot'};`, 'foo=bar;\nbaz=zot;');
});

javascriptTest('nested interpolation', () => {
  assert.equal(javascript`foo=${javascript`(bar=${'zot'})`}`, 'foo=(bar=zot)');
});

javascriptTest('array interpolation', () => {
  const arr = [
    ['a1', 'a2'],
    ['b1', 'b2'],
    ['c1', 'c2'],
  ];
  assert.equal(javascript`foo=${arr.map((arr2) => arr2[0])};`, 'foo=a1b1c1;');
  assert.equal(
    javascript`foo=1${arr.map((arr2) => arr2.map((i) => javascript`*${i}`))};`,
    'foo=1*a1*a2*b1*b2*c1*c2;'
  );
});

javascriptTest.run();
