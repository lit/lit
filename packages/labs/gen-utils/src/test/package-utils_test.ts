/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

import {suite} from 'uvu';
import {installPackage, buildPackage} from '../lib/package-utils.js';

const test = suite<{outputFolder: string}>('test');

test.before((ctx) => {
  // TODO(kschaaf): Use FilesystemTestRig once moved into test utils
  ctx.outputFolder = fs.mkdtempSync(
    path.join(os.tmpdir(), 'packageUtilsTest-')
  );
  if (!ctx.outputFolder) {
    throw new Error(`Failed to create temp dir under ${os.tmpdir()}`);
  }
});

test.after(({outputFolder}) => {
  fs.rmSync(outputFolder, {recursive: true});
});

test('install package', async ({outputFolder}) => {
  fs.writeFileSync(
    path.join(outputFolder, 'package.json'),
    JSON.stringify({
      name: 'test-package',
      dependencies: {
        lit: '^2.0.0',
      },
    })
  );

  await installPackage(outputFolder);

  assert.ok(
    fs.readFileSync(path.join(outputFolder, 'node_modules', 'lit', 'index.js'))
      .length > 0
  );
});

test('install package with monorepo link', async ({outputFolder}) => {
  fs.writeFileSync(
    path.join(outputFolder, 'package.json'),
    JSON.stringify({
      dependencies: {
        lit: '^2.0.0',
      },
    })
  );

  await installPackage(outputFolder, {
    lit: '../../lit',
  });

  assert.ok(
    fs.readFileSync(path.join(outputFolder, 'node_modules', 'lit', 'index.js'))
      .length > 0
  );
});

test('build package', async ({outputFolder}) => {
  fs.writeFileSync(
    path.join(outputFolder, 'package.json'),
    JSON.stringify({
      scripts: {
        build: 'echo hello>hello.txt',
      },
    })
  );

  await buildPackage(outputFolder);

  assert.equal(
    String(fs.readFileSync(path.join(outputFolder, 'hello.txt'))),
    'hello\n'
  );
});

test.run();
