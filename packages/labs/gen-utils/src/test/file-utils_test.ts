/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {FilesystemTestRig} from 'tests/utils/filesystem-test-rig.js';
import {writeFileTree, javascript} from '../lib/file-utils.js';

const writeFileTreeTest = suite<{tempFs: FilesystemTestRig}>('writeFileTree');

writeFileTreeTest.before(async (ctx) => {
  ctx.tempFs = new FilesystemTestRig();
  await ctx.tempFs.setup();
});

writeFileTreeTest.after(async ({tempFs}) => {
  await tempFs.cleanup();
});

writeFileTreeTest('top-level files', async ({tempFs}) => {
  await writeFileTree(tempFs.rootDir, {
    foo: 'foo',
    'bar.js': 'bar.js',
  });
  assert.equal(tempFs.read('foo'), 'foo');
  assert.equal(tempFs.read('bar.js'), 'bar.js');
});

writeFileTreeTest('files in folders', async ({tempFs}) => {
  await writeFileTree(tempFs.rootDir, {
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
  assert.equal(tempFs.read('dir1/foo1'), 'foo1');
  assert.equal(tempFs.read('dir1/bar1.js'), 'bar1.js');
  assert.equal(
    tempFs.read('dir1/dir2/dir3/some-really_long.filename.js'),
    'some-really_long.filename.js'
  );
});

writeFileTreeTest('filenames containing folders', async ({tempFs}) => {
  await writeFileTree(tempFs.rootDir, {
    'file/with/dir/baz.js': 'baz.js',
    dir3: {
      'file/in/dir3/zot.js': 'zot.js',
    },
  });

  assert.equal(tempFs.read('file/with/dir/baz.js'), 'baz.js');
  assert.equal(tempFs.read('dir3/file/in/dir3/zot.js'), 'zot.js');
});

writeFileTreeTest('errors when file escapes root folder', async ({tempFs}) => {
  try {
    await writeFileTree(tempFs.rootDir, {
      'too_many/../../dots': 'baz.js',
    });
    assert.unreachable('Expected writeFileTree to throw an error');
  } catch (e) {
    assert.instance(e, Error);
    assert.match((e as Error).message, 'is not contained in');
  }
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
