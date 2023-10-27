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
import {DiagnosticCode} from '../../lib/diagnostic-code.js';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(`Basic Analyzer tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'basic-elements');
  });

  test('Reads project files', ({analyzer, packagePath}) => {
    const rootFileNames = analyzer.program.getRootFileNames();
    assert.equal(rootFileNames.length, 7);

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

  test('Only identifier-named properties are supported', ({analyzer}) => {
    const result = analyzer.getPackage();
    const mod = result.modules.find(
      (m) =>
        m.sourcePath ===
        getSourceFilename('class-with-unsupported-property', lang)
    );
    assert.ok(mod);

    const declaration = mod.getDeclaration('ClassWithUnsupportedProperty');
    assert.ok(declaration?.isClassDeclaration());

    // Fields named with symbols are not visible in the `fields` iterator.
    assert.equal(Array.from(declaration.fields).length, 0);

    // Fields named with symbols result in a diagnostic.
    const diagnostics = [...analyzer.getDiagnostics()];
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].code, DiagnosticCode.UNSUPPORTED);
  });

  test.run();
}
