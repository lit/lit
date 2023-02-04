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
import {getOutputFilename, getSourceFilename, languages} from './utils.js';

import {createPackageAnalyzer, Analyzer, AbsolutePath} from '../index.js';

for (const lang of languages) {
  const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
    `Basic Analyzer tests (${lang})`
  );

  test.before((ctx) => {
    try {
      const packagePath = (ctx.packagePath = fileURLToPath(
        new URL(`../test-files/${lang}/basic-elements`, import.meta.url).href
      ) as AbsolutePath);
      ctx.analyzer = createPackageAnalyzer(packagePath);
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
  });

  test('Reads project files', ({analyzer, packagePath}) => {
    const rootFileNames = analyzer.program.getRootFileNames();
    assert.equal(rootFileNames.length, 6);

    const elementAPath = path.resolve(
      packagePath,
      getSourceFilename('element-a', lang)
    );
    const sourceFile = analyzer.program.getSourceFile(elementAPath);
    assert.ok(sourceFile);
  });

  test('Analyzer finds class declarations', ({analyzer}) => {
    const result = analyzer.getPackage();
    const elementAModule = result.modules.find(
      (m) => m.sourcePath === getSourceFilename('class-a', lang)
    );
    assert.equal(elementAModule?.jsPath, getOutputFilename('class-a', lang));
    assert.equal(elementAModule?.declarations.length, 1);
    assert.equal(elementAModule?.declarations[0].name, 'ClassA');
  });

  test.run();
}
