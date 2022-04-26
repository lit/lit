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

const basicTest = suite('Basic');

const basicElementsPackagePath = fileURLToPath(
  new URL('../test-files/basic-elements', import.meta.url).href
);

let analyzer: Analyzer;

basicTest.before(() => {
  analyzer = new Analyzer(basicElementsPackagePath);
});

basicTest('Reads project files', () => {
  const rootFileNames = analyzer.program.getRootFileNames();
  assert.equal(rootFileNames.length, 3);

  const elementAPath = path.resolve(
    basicElementsPackagePath,
    'src/element-a.ts'
  );
  const sourceFile = analyzer.program.getSourceFile(elementAPath);
  assert.ok(sourceFile);
});

basicTest('isLitElement returns true for a direct import', () => {
  const elementAPath = path.resolve(
    basicElementsPackagePath,
    'src/element-a.ts'
  );
  const sourceFile = analyzer.program.getSourceFile(elementAPath)!;
  const elementADeclaration = sourceFile.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.getText() === 'ElementA'
  );
  assert.ok(elementADeclaration);
  assert.equal(analyzer.isLitElement(elementADeclaration), true);
});

basicTest('isLitElement returns false for non-LitElement', () => {
  const notLitPath = path.resolve(basicElementsPackagePath, 'src/not-lit.ts');
  const sourceFile = analyzer.program.getSourceFile(notLitPath)!;
  const notLitDeclaration = sourceFile.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.getText() === 'NotLit'
  );
  assert.ok(notLitDeclaration);
  assert.equal(analyzer.isLitElement(notLitDeclaration), false);
});

basicTest.run();
