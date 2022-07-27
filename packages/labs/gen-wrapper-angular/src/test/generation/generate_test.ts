/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {
  buildPackage,
  installPackage,
} from '@lit-labs/gen-utils/lib/package-utils.js';
import {writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {generateAngularWrapper} from '../../index.js';
import {assertGoldensMatch} from '@lit-internal/tests/utils/assert-goldens.js';

import {stdin, cwd} from 'process';

const testProjects = '../test-projects';
const angularWorkspaceTemplate = path.resolve('./test-files/angular-workspace');

test('basic wrapper generation', async () => {
  const outputFolder = 'gen-output';
  const angularWorkspaceFolder = path.resolve(
    outputFolder,
    'angular-workspace'
  ) as AbsolutePath;

  const packageName = '@lit-internal/test-element-a';
  const folderName = 'test-element-a';
  const inputPackage = path.resolve(testProjects, folderName);

  try {
    await fs.rm(angularWorkspaceFolder, {recursive: true});
  } catch (e) {
    // angularWorkspaceFolder didn't exist
  }

  await fs.cp(angularWorkspaceTemplate, angularWorkspaceFolder, {
    recursive: true,
  });
  await installPackage(angularWorkspaceFolder);

  const angularJsonPath = path.resolve(angularWorkspaceFolder, 'angular.json');
  const angularJson = JSON.parse(await fs.readFile(angularJsonPath, 'utf-8'));
  const newProjectRoot = angularJson.newProjectRoot;

  const outputPackage = path.resolve(
    angularWorkspaceFolder,
    newProjectRoot,
    folderName + '-ng'
  );

  const analyzer = new Analyzer(inputPackage as AbsolutePath);
  const analysis = analyzer.analyzePackage();
  await writeFileTree(
    outputFolder,
    await generateAngularWrapper(
      {analysis, console, stdin, cwd: cwd()},
      angularWorkspaceFolder
    )
  );

  const wrapperSourceFile = await fs.readFile(
    path.join(outputPackage, 'src', 'element-a.ts')
  );
  assert.ok(wrapperSourceFile.length > 0);

  await assertGoldensMatch(outputPackage, path.join('goldens', folderName), {
    formatGlob: '**/*.{ts,js,json}',
  });

  await installPackage(outputPackage, {
    [packageName]: inputPackage,
  });

  await buildPackage(outputPackage);
});

test.run();
