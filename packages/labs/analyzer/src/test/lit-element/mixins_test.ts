/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
import 'source-map-support/register.js';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';
import ts from 'typescript';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
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
  const module = pkg.modules.find(
    (m) => m.sourcePath === path.normalize('src/mixins.ts')
  );
  const decl = module!.declarations.find(
    (d) => d.name === 'Highlightable'
  ) as MixinDeclaration;
  assert.instance(decl, MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'HighlightableElement');
  assert.ok(classDecl.reactiveProperties.get('highlight'));
});

test('basic mixin usage', () => {
  const module = pkg.modules.find(
    (m) => m.sourcePath === path.normalize('src/element-a.ts')
  );
  const decl = module!.declarations.find(
    (d) => d.name === 'ElementA'
  ) as LitElementDeclaration;
  assert.instance(decl, LitElementDeclaration);
  assert.ok(ts.isImportSpecifier(decl.superClassDeclarationNode!));
  assert.equal(decl.superClassDeclarationNode?.name?.text, 'LitElement');
  assert.equal(decl.mixinDeclarationNodes.length, 1);
  assert.equal(decl.mixinDeclarationNodes[0].name?.text, 'Highlightable');
});

test('complex mixin declaration A', () => {
  const module = pkg.modules.find(
    (m) => m.sourcePath === path.normalize('src/mixins.ts')
  );
  const decl = module!.declarations.find(
    (d) => d.name === 'Highlightable'
  ) as MixinDeclaration;
  assert.instance(decl, MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'HighlightableElement');
  assert.ok(classDecl.reactiveProperties.get('highlight'));
});

test('complex mixin usage', () => {
  const module = pkg.modules.find(
    (m) => m.sourcePath === path.normalize('src/element-b.ts')
  );
  const decl = module!.declarations.find(
    (d) => d.name === 'ElementB'
  ) as LitElementDeclaration;
  assert.instance(decl, LitElementDeclaration);
  assert.ok(ts.isImportSpecifier(decl.superClassDeclarationNode!));
  assert.equal(decl.superClassDeclarationNode?.name?.text, 'LitElement');
  assert.equal(decl.mixinDeclarationNodes.length, 3);
  assert.equal(decl.mixinDeclarationNodes[0].name?.text, 'A');
  assert.equal(decl.mixinDeclarationNodes[1].name?.text, 'B');
  assert.equal(decl.mixinDeclarationNodes[2].name?.text, 'C');
});

test.run();
