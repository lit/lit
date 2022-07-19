/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
import 'source-map-support/register.js';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
// import ts from 'typescript';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath, PackagePath} from '../../lib/paths.js';
import {
  Package,
  ClassDeclaration,
  LitElementDeclaration,
  MixinDeclaration,
} from '../../lib/model.js';

const test = suite<{pkg: Package; packagePath: AbsolutePath}>(
  'LitElement tests'
);

let pkg: Package;
const packagePath = fileURLToPath(
  new URL('../../test-files/mixins', import.meta.url).href
) as AbsolutePath;

try {
  const analyzer = new Analyzer(packagePath);
  pkg = analyzer.analyzePackage();
} catch (error) {
  console.error(error);
  process.exit(1);
}

test('basic mixin declaration', () => {
  const module = pkg.getModule('mixins.js' as PackagePath);
  const decl = module.getExport('Highlightable', MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'HighlightableElement');
  assert.ok(classDecl.reactiveProperties.get('highlight'));
});

test('basic mixin usage', () => {
  const module = pkg.getModule('element-a.js' as PackagePath);
  const decl = module.getExport('ElementA', LitElementDeclaration);
  assert.ok(decl.heritage.superClass);
  assert.equal(decl.heritage.superClass.name, 'LitElement');
  assert.equal(decl.heritage.mixins.length, 1);
  assert.equal(decl.heritage.mixins[0].name, 'Highlightable');
});

test('complex mixin declaration A', () => {
  const module = pkg.getModule('mixins.js' as PackagePath);
  const decl = module.getExport('A', MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'A');
  assert.ok(classDecl.reactiveProperties.get('a'));
});

test('complex mixin declaration B', () => {
  const module = pkg.getModule('mixins.js' as PackagePath);
  const decl = module.getExport('B', MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'B');
  assert.ok(classDecl.reactiveProperties.get('b'));
});

test('complex mixin declaration C', () => {
  const module = pkg.getModule('mixins.js' as PackagePath);
  const decl = module.getExport('C', MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'C');
  assert.ok(classDecl.reactiveProperties.get('c'));
});

test('complex mixin usage', () => {
  const module = pkg.getModule('element-b.js' as PackagePath);
  const decl = module.getExport('ElementB', LitElementDeclaration);
  assert.ok(decl.heritage.superClass);
  assert.equal(decl.heritage.superClass.name, 'LitElement');
  assert.equal(decl.heritage.mixins.length, 3);
  assert.equal(decl.heritage.mixins[0].name, 'A');
  assert.equal(decl.heritage.mixins[1].name, 'B');
  assert.equal(decl.heritage.mixins[2].name, 'C');
});

test('mixins applied outside extends clause', () => {
  const module = pkg.getModule('element-c.js' as PackagePath);
  const decl = module.getExport('ElementC', LitElementDeclaration);
  assert.ok(decl.heritage.superClass);
  assert.equal(decl.heritage.superClass.name, 'CBase');
  const superClass = decl.heritage.superClass.dereference();
  assert.ok(superClass);
  assert.ok(superClass.heritage.superClass);
  assert.equal(superClass.heritage.superClass.name, 'LitElement');
  assert.equal(superClass.heritage.mixins.length, 1);
  assert.equal(superClass.heritage.mixins[0].name, 'C');
});

test.run();
