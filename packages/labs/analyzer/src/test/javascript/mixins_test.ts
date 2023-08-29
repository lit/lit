/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

import {
  AnalyzerTestContext,
  languages,
  setupAnalyzerForTest,
} from '../utils.js';
import {ClassDeclaration, LitElementDeclaration} from '../../lib/model.js';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(`Mixin tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'mixins');
  });

  test('basic mixin declaration', ({getModule}) => {
    const decl = getModule('mixins').getDeclaration('Highlightable');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'HighlightableElement');
    assert.ok(classDecl.reactiveProperties.get('highlight'));
  });

  test('basic mixin usage', ({getModule}) => {
    const decl = getModule('element-a').getDeclaration('ElementA');
    assert.ok(decl.isLitElementDeclaration());
    assert.ok(decl.heritage.superClass);
    assert.equal(decl.heritage.superClass.name, 'LitElement');
    assert.equal(decl.heritage.mixins.length, 1);
    assert.equal(decl.heritage.mixins[0].name, 'Highlightable');
  });

  test('complex mixin declaration A', ({getModule}) => {
    const decl = getModule('mixins').getDeclaration('A');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'A');
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(classDecl.getField('a'));
    }
    assert.ok(classDecl.reactiveProperties.get('a'));
  });

  test('complex mixin declaration B', ({getModule}) => {
    const decl = getModule('mixins').getDeclaration('B');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'B');
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(classDecl.getField('b'));
    }
    assert.ok(classDecl.reactiveProperties.get('b'));
  });

  test('complex mixin declaration C', ({getModule}) => {
    const decl = getModule('mixins').getDeclaration('C');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'C');
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(classDecl.getField('c'));
    }
    assert.ok(classDecl.reactiveProperties.get('c'));
  });

  test('complex mixin usage', ({getModule}) => {
    const decl = getModule('element-b').getDeclaration('ElementB');
    assert.ok(decl.isLitElementDeclaration());
    assert.ok(decl.heritage.superClass);
    assert.equal(decl.heritage.superClass.name, 'LitElement');
    assert.equal(decl.heritage.mixins.length, 3);
    assert.equal(decl.heritage.mixins[0].name, 'A');
    const a = decl.heritage.mixins[0].dereference();
    assert.ok(a.isMixinDeclaration());
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(a.classDeclaration.getField('a'));
    }
    assert.ok(a.classDeclaration.isLitElementDeclaration());
    assert.ok(a.classDeclaration.reactiveProperties.get('a'));
    assert.equal(decl.heritage.mixins[1].name, 'B');
    const b = decl.heritage.mixins[1].dereference();
    assert.ok(b.isMixinDeclaration());
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(b.classDeclaration.getField('b'));
    }
    assert.ok(b.classDeclaration.isLitElementDeclaration());
    assert.ok(b.classDeclaration.reactiveProperties.get('b'));
    assert.equal(decl.heritage.mixins[2].name, 'C');
    const c = decl.heritage.mixins[2].dereference();
    assert.ok(c.isMixinDeclaration());
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(c.classDeclaration.getField('c'));
    }
    assert.ok(c.classDeclaration.isLitElementDeclaration());
    assert.ok(c.classDeclaration.reactiveProperties.get('c'));
  });

  test('mixins applied outside extends clause', ({getModule}) => {
    const decl = getModule('element-c').getDeclaration('ElementC');
    assert.ok(decl.isLitElementDeclaration());
    assert.ok(decl.heritage.superClass);
    assert.equal(decl.heritage.superClass.name, 'CBase');
    const superClass = decl.heritage.superClass.dereference(ClassDeclaration);
    assert.ok(superClass);
    assert.ok(superClass.heritage.superClass);
    assert.equal(superClass.heritage.superClass.name, 'LitElement');
    assert.equal(superClass.heritage.mixins.length, 1);
    assert.equal(superClass.heritage.mixins[0].name, 'C');
  });

  test.run();
}
