/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';
import {fileURLToPath} from 'url';

import {Analyzer} from '../lib/analyzer.js';
import {AbsolutePath} from '../lib/paths.js';

const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
  'Basic Analyzer tests'
);

test.before((ctx) => {
  const packagePath = (ctx.packagePath = fileURLToPath(
    new URL('../test-files/basic-elements', import.meta.url).href
  ) as AbsolutePath);
  ctx.analyzer = new Analyzer(packagePath);
});

test('Reads project files', ({analyzer, packagePath}) => {
  const rootFileNames = analyzer.program.getRootFileNames();
  assert.equal(rootFileNames.length, 5);

  const elementAPath = path.resolve(packagePath, 'src/element-a.ts');
  const sourceFile = analyzer.program.getSourceFile(elementAPath);
  assert.ok(sourceFile);
});

test('Analyzer finds class declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.path === 'src/class-a.ts'
  );
  assert.equal(elementAModule?.declarations.length, 1);
  assert.equal(elementAModule?.declarations[0].name, 'ClassA');
});

test.run();
