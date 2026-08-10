/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as assert from 'node:assert';
import {describe as suite, test} from 'node:test';
import {languages, setupAnalyzerForTest} from '../utils.js';
import {VariableDeclaration} from '../../../package-analyzer.js';

// Get actual constructor to test internal ability to assert the type
// of a dereferenced Declaration
import {ClassDeclaration, LitElementDeclaration} from '../../../lib/model.js';

// Regression test suite for errors that can happen with NodeNext resolution
suite('LitElement regression tests', () => {
  const {getModule} = setupAnalyzerForTest('ts', 'node-next-resolution');

  test('Analyzer finds LitElement declarations with NodeNext resolution', () => {
    const elementAModule = getModule('element-a');
    assert.equal(elementAModule?.declarations.length, 1);
    const decl = elementAModule!.declarations[0];
    assert.equal(decl.name, 'ElementA');
    assert.ok(decl.isLitElementDeclaration());
    assert.equal(decl.tagname, 'element-a');

    // Make sure inferred references to this type resolve
    const mainModule = getModule('main');
    const variableDecl = mainModule!.declarations[0] as VariableDeclaration;
    assert.equal(variableDecl.name, 'element');
    // This will throw if we don't handle extensions for type imports correctly
    assert.equal(variableDecl.type!.references.length, 1);
  });
});

for (const lang of languages) {
  suite(`LitElement tests (${lang})`, () => {
    const {getModule} = setupAnalyzerForTest(lang, 'basic-elements');

    test('isLitElementDeclaration returns false for non-LitElement', () => {
      const elementAModule = getModule('not-lit');
      const decl = elementAModule?.getDeclaration('NotLit');
      assert.ok(decl);
      assert.equal(decl.isLitElementDeclaration(), false);
    });

    test('Analyzer finds LitElement declarations', () => {
      const elementAModule = getModule('element-a');
      assert.equal(elementAModule?.declarations.length, 1);
      const decl = elementAModule!.declarations[0];
      assert.equal(decl.name, 'ElementA');
      assert.ok(decl.isLitElementDeclaration());
      assert.equal(decl.tagname, 'element-a');
    });

    test('Analyzer finds LitElement properties ', () => {
      const elementAModule = getModule('element-a');
      const decl = elementAModule?.getDeclaration('ElementA');
      assert.ok(decl?.isLitElementDeclaration());

      // ElementA has `a` and `b` properties
      assert.equal(decl.reactiveProperties.size, 3);

      const aProp = decl.reactiveProperties.get('a');
      assert.ok(aProp);
      assert.equal(aProp.name, 'a', 'property name');
      assert.equal(aProp.attribute, 'a', 'attribute name');
      assert.equal(aProp.type?.text, 'string');
      // TODO (justinfagnani) better assertion
      assert.ok(aProp.type);
      assert.equal(aProp.reflect, false);

      const bProp = decl.reactiveProperties.get('b');
      assert.ok(bProp);
      assert.equal(bProp.name, 'b');
      assert.equal(bProp.attribute, 'bbb');
      assert.equal(bProp.type?.text, 'number');
      assert.equal(bProp.typeOption, 'Number');

      const cProp = decl.reactiveProperties.get('c');
      assert.ok(cProp);
      assert.equal(cProp.name, 'c');
      assert.equal(cProp.attribute, 'c');
      assert.equal(cProp.type?.text, lang === 'ts' ? 'any' : undefined);
    });

    test('Analyzer finds LitElement properties from static getter', () => {
      const elementBModule = getModule('element-b');

      const decl = elementBModule?.getDeclaration('ElementB');
      assert.ok(decl?.isLitElementDeclaration());

      // ElementB has `foo` and `bar` properties defined in a static properties getter
      assert.equal(decl.reactiveProperties.size, 2);

      const fooProp = decl.reactiveProperties.get('foo');
      assert.ok(fooProp);
      assert.equal(fooProp.name, 'foo', 'property name');
      assert.equal(fooProp.attribute, 'foo', 'attribute name');
      assert.equal(fooProp.type?.text, 'string');
      assert.equal(fooProp.reflect, false);

      const bProp = decl.reactiveProperties.get('bar');
      assert.ok(bProp);
      assert.equal(bProp.name, 'bar');
      assert.equal(bProp.attribute, 'bar');

      // This is inferred
      assert.equal(bProp.type?.text, 'number');
      assert.equal(bProp.typeOption, 'Number');
    });

    test('Analyezr finds subclass of LitElement', () => {
      const module = getModule('element-c');
      const elementC = module?.getDeclaration('ElementC');
      assert.ok(elementC?.isLitElementDeclaration());

      assert.equal(elementC.reactiveProperties.size, 1);
      const bazProp = elementC.reactiveProperties.get('baz');
      assert.ok(bazProp);

      const elementBRef = elementC.heritage.superClass;
      assert.ok(elementBRef);
      const elementB = elementBRef.dereference(LitElementDeclaration);
      assert.ok(elementB.isLitElementDeclaration());
      assert.ok(elementB.name, 'ElementB');
      assert.equal(elementB.reactiveProperties.size, 2);
      const fooProp = elementB.reactiveProperties.get('foo');
      assert.ok(fooProp);
      const barProp = elementB.reactiveProperties.get('bar');
      assert.ok(barProp);

      const litElementRef = elementB.heritage.superClass;
      assert.ok(litElementRef);
      const litElement = litElementRef.dereference(ClassDeclaration);
      assert.ok(litElement.isClassDeclaration());
      assert.equal(litElement.isLitElementDeclaration(), false);
      assert.ok(litElement.name, 'LitElement');
    });
  });
}
