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
import {isLitElement} from '../lib/lit-element.js';

const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
  'LitElement tests'
);

test.before((ctx) => {
  const packagePath = (ctx.packagePath = fileURLToPath(
    new URL('../test-files/basic-elements', import.meta.url).href
  ) as AbsolutePath);
  ctx.analyzer = new Analyzer(packagePath);
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
  assert.equal(isLitElement(elementADeclaration, analyzer.checker), true);
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
  assert.equal(isLitElement(notLitDeclaration, analyzer.checker), false);
});

test('Analyzer finds LitElement declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.path === 'src/element-a.ts'
  );
  assert.equal(elementAModule?.declarations.length, 1);
  const decl = elementAModule!.declarations[0];
  assert.equal(decl.name, 'ElementA');
  assert.instance(decl, LitElementDeclaration);
  assert.equal((decl as LitElementDeclaration).isLitElement, true);

  // TODO (justinfagnani): test for customElements.define()
  assert.equal((decl as LitElementDeclaration).tagname, 'element-a');
});

test.run();
