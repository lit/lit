/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as fs from 'fs';
import * as path from 'path';
import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {generateManifest} from '../index.js';
import {assertGoldensMatch} from '@lit-internal/tests/utils/assert-goldens.js';

const testProjects = '../test-projects';
const outputFolder = 'gen-output';

test('basic manifest generation', async () => {
  const project = 'test-element-a';
  const inputPackage = path.resolve(testProjects, project);

  if (fs.existsSync(outputFolder)) {
    fs.rmSync(outputFolder, {recursive: true});
  }

  const analyzer = new Analyzer(inputPackage as AbsolutePath);
  const analysis = analyzer.analyzePackage();
  await writeFileTree(outputFolder, await generateManifest(analysis));

  await assertGoldensMatch(outputFolder, path.join('goldens', project), {
    formatGlob: '**/*.json',
  });
});

test.run();
