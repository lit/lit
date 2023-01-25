/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {suite} from 'uvu';
import {
  installPackage,
  buildPackage,
  packPackage,
} from '../lib/package-utils.js';
import {FilesystemTestRig} from '@lit-internal/tests/utils/filesystem-test-rig.js';

const test = suite<{tempFs: FilesystemTestRig}>('test');

test.before(async (ctx) => {
  ctx.tempFs = new FilesystemTestRig();
  await ctx.tempFs.setup();
});

test.after(async ({tempFs}) => {
  await tempFs.cleanup();
});

test('install package', async ({tempFs}) => {
  await tempFs.write('package.json', {
    name: 'test-package',
    dependencies: {
      lit: '^2.0.0',
    },
  });

  await installPackage(tempFs.rootDir);

  assert.ok((await tempFs.read('node_modules', 'lit', 'index.js')).length > 0);
});

// TODO(aomarks) Temporarily skipped because @lit/reactive-element has a new
// dependency on @lit-labs/ssr-dom-shim, so this test will fail until the first
// version of that package is published.
test.skip('install package with monorepo link', async ({tempFs}) => {
  await tempFs.write('package.json', {
    dependencies: {
      lit: '^2.0.0',
      'lit-html': '^2.0.0',
      'lit-element': '^3.0.0',
      '@lit/reactive-element': '^1.0.0',
    },
  });

  await installPackage(tempFs.rootDir, {
    lit: '../../lit',
    'lit-html': '../../lit-html',
    'lit-element': '../../lit-element',
    '@lit/reactive-element': '../../reactive-element',
  });

  assert.ok((await tempFs.read('node_modules', 'lit', 'index.js')).length > 0);
  assert.ok(
    (await tempFs.read('node_modules', 'lit-html', 'lit-html.js')).length > 0
  );
  assert.ok(
    (await tempFs.read('node_modules', 'lit-element', 'index.js')).length > 0
  );
  assert.ok(
    (
      await tempFs.read(
        'node_modules',
        '@lit',
        'reactive-element',
        'reactive-element.js'
      )
    ).length > 0
  );
});

test('build package', async ({tempFs}) => {
  await tempFs.write('package.json', {
    scripts: {
      build: 'echo hello>hello.txt',
    },
  });

  await buildPackage(tempFs.rootDir);

  assert.equal((await tempFs.read('hello.txt')).trim(), 'hello');
});

test('pack package', async ({tempFs}) => {
  await tempFs.write('package.json', {
    name: 'pack-test',
    version: '1.2.3',
    files: ['a', 'b/c'],
  });

  await tempFs.write('a', 'a');
  await tempFs.write(['b', 'c'], 'c');

  const tarballFile = await packPackage(tempFs.rootDir);

  await tempFs.write(['test-output', 'package.json'], {
    dependencies: {
      'pack-test': `file:${tarballFile}`,
    },
  });

  await installPackage(tempFs.resolve('test-output'));

  assert.equal(
    await tempFs.read('test-output', 'node_modules', 'pack-test', 'a'),
    'a'
  );
  assert.equal(
    await tempFs.read('test-output', 'node_modules', 'pack-test', 'b', 'c'),
    'c'
  );
});

test.run();
