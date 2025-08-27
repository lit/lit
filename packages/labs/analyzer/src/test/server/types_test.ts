/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as assert from 'node:assert';
import {describe as suite, test} from 'node:test';
import {Module, getImportsStringForReferences} from '../../index.js';
import {Reference} from '../../lib/model.js';
import {languages, setupAnalyzerForTestWithModule} from './utils.js';

for (const lang of languages) {
  suite(`Types tests (${lang})`, () => {
    const typeForVariable = (module: Module, name: string) => {
      const dec = module.getDeclaration(name);
      assert.ok(dec.isVariableDeclaration());
      assert.ok(dec, `Could not find symbol named ${name}`);
      const type = dec.type;
      assert.ok(type);
      return type;
    };

    const {module} = setupAnalyzerForTestWithModule(lang, 'types', 'module');

    test('testString', () => {
      const type = typeForVariable(module, 'testString');
      assert.equal(type.text, 'string');
      assert.equal(type.references.length, 0);
    });

    test('inferredString', () => {
      const type = typeForVariable(module, 'inferredString');
      assert.equal(type.text, 'string');
      assert.equal(type.references.length, 0);
    });

    test('localClass', () => {
      const type = typeForVariable(module, 'localClass');
      assert.equal(type.text, 'LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('importedClass', () => {
      const type = typeForVariable(module, 'importedClass');
      assert.equal(type.text, 'ImportedClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'ImportedClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'external.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('localInterface', () => {
      const type = typeForVariable(module, 'localInterface');
      assert.equal(type.text, 'LocalInterface');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalInterface');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('importedInterface', () => {
      const type = typeForVariable(module, 'importedInterface');
      assert.equal(type.text, 'ImportedInterface');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'ImportedInterface');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'external.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('testStringNumberUnion', () => {
      const type = typeForVariable(module, 'testStringNumberUnion');
      assert.equal(type.text, 'string | number');
      assert.equal(type.references.length, 0);
    });

    test('testStringClassUnion', () => {
      const type = typeForVariable(module, 'testStringClassUnion');
      assert.equal(type.text, 'string | LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('testStringImportedClassUnion', () => {
      const type = typeForVariable(module, 'testStringImportedClassUnion');
      assert.equal(type.text, 'string | ImportedClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'ImportedClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'external.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('testStringImportedGlobalClassUnion', () => {
      const type = typeForVariable(
        module,
        'testStringImportedGlobalClassUnion'
      );
      assert.equal(type.text, 'string | ImportedClass | HTMLElement');
      assert.equal(type.references.length, 2);
      assert.equal(type.references[0].name, 'ImportedClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'external.js');
      assert.equal(type.references[0].isGlobal, false);
      assert.equal(type.references[1].name, 'HTMLElement');
      assert.equal(type.references[1].isGlobal, true);
    });

    test('inferredLocalClass', () => {
      const type = typeForVariable(module, 'inferredLocalClass');
      assert.equal(type.text, 'LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('inferredImportedClass', () => {
      const type = typeForVariable(module, 'inferredImportedClass');
      assert.equal(type.text, 'ImportedClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'ImportedClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'external.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('complexType', () => {
      const type = typeForVariable(module, 'complexType');
      assert.equal(
        type.text,
        'Promise<Map<keyof LitElement, ImportedClass[]>>[]'
      );
      assert.equal(type.references.length, 4);
      assert.equal(type.references[0].name, 'Promise');
      assert.equal(type.references[0].isGlobal, true);
      assert.equal(type.references[1].name, 'Map');
      assert.equal(type.references[1].isGlobal, true);
      assert.equal(type.references[2].name, 'LitElement');
      assert.equal(type.references[2].package, 'lit');
      assert.equal(type.references[2].module, undefined);
      assert.equal(type.references[2].isGlobal, false);
      assert.equal(type.references[3].name, 'ImportedClass');
      assert.equal(type.references[3].package, '@lit-internal/test-types');
      assert.equal(type.references[3].module, 'external.js');
      assert.equal(type.references[3].isGlobal, false);
    });

    test('destructObj', () => {
      const type = typeForVariable(module, 'destructObj');
      assert.equal(type.text, 'LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('destructObjNested', () => {
      const type = typeForVariable(module, 'destructObjNested');
      assert.equal(type.text, 'LitElement');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LitElement');
      assert.equal(type.references[0].package, 'lit');
      assert.equal(type.references[0].module, undefined);
      assert.equal(type.references[0].isGlobal, false);
    });

    test('separatelyExportedClass', () => {
      const type = typeForVariable(module, 'separatelyExportedClass');
      assert.equal(type.text, 'LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('separatelyExportedDestructObj', () => {
      const type = typeForVariable(module, 'separatelyExportedDestructObj');
      assert.equal(type.text, 'LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('separatelyExportedDestructObjNested', () => {
      const type = typeForVariable(
        module,
        'separatelyExportedDestructObjNested'
      );
      assert.equal(type.text, 'LitElement');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LitElement');
      assert.equal(type.references[0].package, 'lit');
      assert.equal(type.references[0].module, undefined);
      assert.equal(type.references[0].isGlobal, false);
    });

    test('separatelyExportedDestructArr', () => {
      const type = typeForVariable(module, 'separatelyExportedDestructArr');
      assert.equal(type.text, 'LocalClass');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LocalClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'module.js');
      assert.equal(type.references[0].isGlobal, false);
    });

    test('separatelyExportedDestructArrNested', () => {
      const type = typeForVariable(
        module,
        'separatelyExportedDestructArrNested'
      );
      assert.equal(type.text, 'LitElement');
      assert.equal(type.references.length, 1);
      assert.equal(type.references[0].name, 'LitElement');
      assert.equal(type.references[0].package, 'lit');
      assert.equal(type.references[0].module, undefined);
      assert.equal(type.references[0].isGlobal, false);
    });

    test('importedType', () => {
      const type = typeForVariable(module, 'importedType');
      //assert.equal(type.text, 'TemplateResult<1>');
      assert.equal(type.references.length, 2);
      assert.equal(type.references[0].name, 'ImportedClass');
      assert.equal(type.references[0].package, '@lit-internal/test-types');
      assert.equal(type.references[0].module, 'external.js');
      assert.equal(type.references[0].isGlobal, false);
      assert.equal(type.references[1].name, 'TemplateResult');
      assert.equal(type.references[1].package, 'lit-html');
      assert.equal(type.references[1].module, undefined);
      assert.equal(type.references[1].isGlobal, false);
    });

    test('getImportsStringForReferences', () => {
      const type = typeForVariable(module, 'complexType');
      assert.equal(
        getImportsStringForReferences(type.references),
        `
import {LitElement} from 'lit';
import {ImportedClass} from '@lit-internal/test-types/external.js';
  `.trim()
      );
    });

    test('getImportsStringForReferences coalesced', () => {
      const reference = [
        new Reference({package: 'foo', name: 'foo1'}),
        new Reference({package: 'bar', name: 'bar1'}),
        new Reference({package: 'foo', name: 'foo1'}),
        new Reference({package: 'foo', name: 'foo2'}),
        new Reference({package: 'bar', name: 'bar2'}),
        new Reference({package: 'bar', name: 'bar2'}),
        new Reference({package: 'foo', name: 'foo3'}),
      ];
      assert.equal(
        getImportsStringForReferences(reference),
        `
import {foo1, foo2, foo3} from 'foo';
import {bar1, bar2} from 'bar';
  `.trim()
      );
    });
  });
}
