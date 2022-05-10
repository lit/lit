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
import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {installPackage, buildPackage, writeFileTree} from '@lit-labs/gen-utils';
import {generateReactWrapper} from '../index.js';

const testProjects = '../test-projects';
const outputFolder = 'gen-output';

test('basic wrapper generation', async () => {
  const project = 'test-element-a';
  const inputPackage = path.resolve(testProjects, project);
  const outputPackage = path.resolve(outputFolder, project + '-react');

  if (fs.existsSync(outputPackage)) {
    fs.rmSync(outputPackage, {recursive: true});
  }

  const analyzer = new Analyzer(inputPackage as AbsolutePath);
  const analysis = analyzer.analyzePackage();
  await writeFileTree(outputFolder, await generateReactWrapper(analysis));

  const wrapperSourceFile = fs.readFileSync(
    path.join(outputPackage, 'src/element-a.ts')
  );
  assert.ok(wrapperSourceFile.length > 0);

  await installPackage(outputPackage, {
    [project]: inputPackage,
    '@lit-labs/react': '../react',
  });

  await buildPackage(outputPackage);

  // TODO(kschaaf): Add golden tests. For now, this verifies the package
  // installation and build nominally succeeded. Note that runtime tests
  // of this generated package are run as a separate `npm run test:output`
  // command via web-test-runner.
  const wrapperJsFile = fs.readFileSync(
    path.join(outputPackage, 'element-a.js')
  );
  assert.ok(wrapperJsFile.length > 0);
});

test.run();
