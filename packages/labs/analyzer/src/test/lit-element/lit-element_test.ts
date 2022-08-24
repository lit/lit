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

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
import {LitElementDeclaration} from '../../lib/model.js';
import {isLitElement} from '../../lib/lit-element/lit-element.js';

const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
  'LitElement tests'
);

test.before((ctx) => {
  try {
    const packagePath = (ctx.packagePath = fileURLToPath(
      new URL('../../test-files/basic-elements', import.meta.url).href
    ) as AbsolutePath);
    ctx.analyzer = new Analyzer(packagePath);
  } catch (error) {
    // Uvu has a bug where it silently ignores failures in before and after,
    // see https://github.com/lukeed/uvu/issues/191.
    console.error('uvu before error', error);
    process.exit(1);
  }
});

test('isLitElement returns true for a direct import', ({
  analyzer,
  packagePath,
}) => {
  const elementAPath = path.resolve(packagePath, 'src', 'element-a.ts');
  const sourceFile = analyzer.context.program.getSourceFile(elementAPath)!;
  const elementADeclaration = sourceFile.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.text === 'ElementA'
  );
  assert.ok(elementADeclaration);
  assert.equal(isLitElement(elementADeclaration, analyzer.context), true);
});

test('isLitElement returns false for non-LitElement', ({
  analyzer,
  packagePath,
}) => {
  const notLitPath = path.resolve(packagePath, 'src', 'not-lit.ts');
  const sourceFile = analyzer.context.program.getSourceFile(notLitPath)!;
  const notLitDeclaration = sourceFile.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.text === 'NotLit'
  );
  assert.ok(notLitDeclaration);
  assert.equal(isLitElement(notLitDeclaration, analyzer.context), false);
});

test('Analyzer finds LitElement declarations', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.sourcePath === path.normalize('src/element-a.ts')
  );
  assert.equal(elementAModule?.declarations.length, 1);
  const decl = elementAModule!.declarations[0];
  assert.equal(decl.name, 'ElementA');
  assert.instance(decl, LitElementDeclaration);
  assert.equal((decl as LitElementDeclaration).isLitElement, true);

  // TODO (justinfagnani): test for customElements.define()
  assert.equal((decl as LitElementDeclaration).tagname, 'element-a');
});

test('Analyzer finds LitElement properties via decorators', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.sourcePath === path.normalize('src/element-a.ts')
  );
  const decl = elementAModule!.declarations[0] as LitElementDeclaration;

  // ElementA has `a` and `b` properties
  assert.equal(decl.reactiveProperties.size, 2);

  const aProp = decl.reactiveProperties.get('a');
  assert.ok(aProp);
  assert.equal(aProp.name, 'a', 'property name');
  assert.equal(aProp.attribute, 'a', 'attribute name');
  assert.equal(aProp.type.text, 'string');
  // TODO (justinfagnani) better assertion
  assert.ok(aProp.type);
  assert.equal(aProp.reflect, false);

  const bProp = decl.reactiveProperties.get('b');
  assert.ok(bProp);
  assert.equal(bProp.name, 'b');
  assert.equal(bProp.attribute, 'bbb');
  // This is inferred
  assert.equal(bProp.type.text, 'number');
  assert.equal(bProp.typeOption, 'Number');
});

test.run();
