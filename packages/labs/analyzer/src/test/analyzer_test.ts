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

import {PackageAnalyzer, AbsolutePath} from '../index.js';

const test = suite<{analyzer: PackageAnalyzer; packagePath: AbsolutePath}>(
  'Basic Analyzer tests'
);

test.before((ctx) => {
  try {
    const packagePath = (ctx.packagePath = fileURLToPath(
      new URL('../test-files/basic-elements', import.meta.url).href
    ) as AbsolutePath);
    ctx.analyzer = new PackageAnalyzer(packagePath);
  } catch (error) {
    // Uvu has a bug where it silently ignores failures in before and after,
    // see https://github.com/lukeed/uvu/issues/191.
    console.error('uvu before error', error);
    process.exit(1);
  }
});

test('Reads project files', ({analyzer, packagePath}) => {
  const rootFileNames = analyzer.program.getRootFileNames();
  assert.equal(rootFileNames.length, 5);

  const elementAPath = path.resolve(packagePath, 'src', 'element-a.ts');
  const sourceFile = analyzer.program.getSourceFile(elementAPath);
  assert.ok(sourceFile);
});

test('Analyzer finds class declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.sourcePath === path.normalize('src/class-a.ts')
  );
  assert.equal(elementAModule?.jsPath, path.normalize('out/class-a.js'));
  assert.equal(elementAModule?.declarations.length, 1);
  assert.equal(elementAModule?.declarations[0].name, 'ClassA');
});

test.run();
