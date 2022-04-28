/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import ts from 'typescript';
import * as path from 'path';
import {fileURLToPath} from 'url';

import {Analyzer} from '../lib/analyzer.js';
import {AbsolutePath} from '../lib/paths.js';
import {LitElementDeclaration} from '../lib/model.js';

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

test('isLitElement returns true for a direct import', ({
  analyzer,
  packagePath,
}) => {
  const elementAPath = path.resolve(packagePath, 'src/element-a.ts');
  const sourceFile = analyzer.program.getSourceFile(elementAPath)!;
  const elementADeclaration = sourceFile.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.getText() === 'ElementA'
  );
  assert.ok(elementADeclaration);
  assert.equal(analyzer.isLitElement(elementADeclaration), true);
});

test('isLitElement returns false for non-LitElement', ({
  analyzer,
  packagePath,
}) => {
  const notLitPath = path.resolve(packagePath, 'src/not-lit.ts');
  const sourceFile = analyzer.program.getSourceFile(notLitPath)!;
  const notLitDeclaration = sourceFile.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.getText() === 'NotLit'
  );
  assert.ok(notLitDeclaration);
  assert.equal(analyzer.isLitElement(notLitDeclaration), false);
});

test('Analyzer finds class declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.path === 'src/class-a.ts'
  );
  assert.equal(elementAModule?.declarations.length, 1);
  assert.equal(elementAModule?.declarations[0].name, 'ClassA');
});

test('Analyzer finds named LitElement declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.path === 'src/element-a.ts'
  );
  assert.ok(elementAModule);
  assert.equal(elementAModule.declarations.length, 1);
  const elementA = elementAModule.declarations[0];
  assert.equal(elementA.name, 'ElementA');
  assert.instance(elementA, LitElementDeclaration);
  assert.equal((elementA as LitElementDeclaration).isLitElement, true);

  // TODO (justinfagnani): test for customElements.define()
  assert.equal((elementA as LitElementDeclaration).tagname, 'element-a');
});

test('Analyzer finds unnamed LitElement declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const defaultElementModule = result.modules.find(
    (m) => m.path === 'src/default-element.ts'
  );
  assert.ok(defaultElementModule);
  assert.equal(defaultElementModule.declarations.length, 1);
  const defaultElement = defaultElementModule.declarations[0];
  assert.equal(defaultElement.name, undefined);
  assert.equal((defaultElement as LitElementDeclaration).tagname, undefined);
});

test.run();
