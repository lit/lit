/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as fs from 'fs';
import * as path from 'path';
import {createPackageAnalyzer} from '@oicl-lit/analyzer/package-analyzer.js';
import {AbsolutePath} from '@oicl-lit/analyzer/lib/paths.js';
import {
  installPackage,
  buildPackage,
} from '@lit-labs/gen-utils/lib/package-utils.js';
import {writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {generateAngularWrapper} from '../../index.js';
import {assertGoldensMatch} from '@lit-internal/tests/utils/assert-goldens.js';

const testProjects = '../test-projects';
const outputFolder = 'gen-output';

test('basic wrapper generation', async () => {
  const packageName = '@lit-internal/test-element-a';
  const folderName = 'test-element-a';
  const inputPackage = path.resolve(testProjects, folderName);
  const outputPackage = path.resolve(outputFolder, folderName + '-ng');

  if (fs.existsSync(outputPackage)) {
    fs.rmSync(outputPackage, {recursive: true});
  }

  const analyzer = createPackageAnalyzer(inputPackage as AbsolutePath);
  const pkg = analyzer.getPackage();
  await writeFileTree(outputFolder, await generateAngularWrapper(pkg));

  const wrapperSourceFile = fs.readFileSync(
    path.join(outputPackage, 'element-a', 'src', 'element-a.ts')
  );
  assert.ok(wrapperSourceFile.length > 0);

  await assertGoldensMatch(outputPackage, path.join('goldens', folderName), {
    formatGlob: '**/*.{ts,js,json}',
  });

  await installPackage(outputPackage, {
    [packageName]: inputPackage,
  });

  await buildPackage(outputPackage);

  // This verifies the package installation and build nominally succeeded. Note
  // that runtime tests of this generated package are run as a separate `npm run
  // test:output` command via web-test-runner.
  const wrapperJsFile = fs.readFileSync(
    path.join(
      outputPackage,
      'dist',
      'fesm2022',
      'lit-internal-test-element-a-ng.mjs'
    )
  );
  assert.ok(wrapperJsFile.length > 0);
});

test('README.md is not copied to generated Angular wrapper', async () => {
  const folderName = 'test-element-a';
  const inputPackage = path.resolve(testProjects, folderName);
  const outputPackage = path.resolve(outputFolder, folderName + '-ng');

  const readmePath = path.join(inputPackage, 'README.md');
  fs.writeFileSync(readmePath, '# Test Element A\n\nThis is a test.');

  try {
    if (fs.existsSync(outputPackage)) {
      fs.rmSync(outputPackage, {recursive: true});
    }

    const analyzer = createPackageAnalyzer(inputPackage as AbsolutePath);
    const pkg = analyzer.getPackage();
    await writeFileTree(outputFolder, await generateAngularWrapper(pkg));

    assert.equal(fs.existsSync(path.join(outputPackage, 'README.md')), false);

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(outputPackage, 'package.json'), 'utf8')
    );
    assert.equal(packageJson.files, undefined);
  } finally {
    if (fs.existsSync(readmePath)) {
      fs.unlinkSync(readmePath);
    }
  }
});

test.run();
