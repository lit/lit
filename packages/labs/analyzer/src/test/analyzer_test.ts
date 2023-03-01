/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';
import {
  AnalyzerTestContext,
  getOutputFilename,
  getSourceFilename,
  languages,
  setupAnalyzerForTest,
} from './utils.js';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(`Basic Analyzer tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'basic-elements');
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
