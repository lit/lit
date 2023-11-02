/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

import {Module, getImportsStringForReferences} from '../../index.js';

import {Reference} from '../../lib/model.js';
import {
  AnalyzerModuleTestContext,
  languages,
  setupAnalyzerForTestWithModule,
} from './utils.js';

for (const lang of languages) {
  const test = suite<AnalyzerModuleTestContext>(`Types tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTestWithModule(ctx, lang, 'types', 'module');
  });

  const typeForVariable = (module: Module, name: string) => {
    const dec = module.getDeclaration(name);
    assert.ok(dec.isVariableDeclaration());
    assert.ok(dec, `Could not find symbol named ${name}`);
    const type = dec.type;
    assert.ok(type);
    return type;
  };

  test('testString', ({module}) => {
    const type = typeForVariable(module, 'testString');
    assert.equal(type.text, 'string');
    assert.equal(type.references.length, 0);
  });

  test('inferredString', ({module}) => {
    const type = typeForVariable(module, 'inferredString');
    assert.equal(type.text, 'string');
    assert.equal(type.references.length, 0);
  });

  test('localClass', ({module}) => {
    const type = typeForVariable(module, 'localClass');
    assert.equal(type.text, 'LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('importedClass', ({module}) => {
    const type = typeForVariable(module, 'importedClass');
    assert.equal(type.text, 'ImportedClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'ImportedClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'external.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('localInterface', ({module}) => {
    const type = typeForVariable(module, 'localInterface');
    assert.equal(type.text, 'LocalInterface');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalInterface');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('importedInterface', ({module}) => {
    const type = typeForVariable(module, 'importedInterface');
    assert.equal(type.text, 'ImportedInterface');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'ImportedInterface');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'external.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('testStringNumberUnion', ({module}) => {
    const type = typeForVariable(module, 'testStringNumberUnion');
    assert.equal(type.text, 'string | number');
    assert.equal(type.references.length, 0);
  });

  test('testStringClassUnion', ({module}) => {
    const type = typeForVariable(module, 'testStringClassUnion');
    assert.equal(type.text, 'string | LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('testStringImportedClassUnion', ({module}) => {
    const type = typeForVariable(module, 'testStringImportedClassUnion');
    assert.equal(type.text, 'string | ImportedClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'ImportedClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'external.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('testStringImportedGlobalClassUnion', ({module}) => {
    const type = typeForVariable(module, 'testStringImportedGlobalClassUnion');
    assert.equal(type.text, 'string | ImportedClass | HTMLElement');
    assert.equal(type.references.length, 2);
    assert.equal(type.references[0].name, 'ImportedClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'external.js');
    assert.equal(type.references[0].isGlobal, false);
    assert.equal(type.references[1].name, 'HTMLElement');
    assert.equal(type.references[1].isGlobal, true);
  });

  test('inferredLocalClass', ({module}) => {
    const type = typeForVariable(module, 'inferredLocalClass');
    assert.equal(type.text, 'LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('inferredImportedClass', ({module}) => {
    const type = typeForVariable(module, 'inferredImportedClass');
    assert.equal(type.text, 'ImportedClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'ImportedClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'external.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('complexType', ({module}) => {
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

  test('destructObj', ({module}) => {
    const type = typeForVariable(module, 'destructObj');
    assert.equal(type.text, 'LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('destructObjNested', ({module}) => {
    const type = typeForVariable(module, 'destructObjNested');
    assert.equal(type.text, 'LitElement');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LitElement');
    assert.equal(type.references[0].package, 'lit');
    assert.equal(type.references[0].module, undefined);
    assert.equal(type.references[0].isGlobal, false);
  });

  test('separatelyExportedClass', ({module}) => {
    const type = typeForVariable(module, 'separatelyExportedClass');
    assert.equal(type.text, 'LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('separatelyExportedDestructObj', ({module}) => {
    const type = typeForVariable(module, 'separatelyExportedDestructObj');
    assert.equal(type.text, 'LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('separatelyExportedDestructObjNested', ({module}) => {
    const type = typeForVariable(module, 'separatelyExportedDestructObjNested');
    assert.equal(type.text, 'LitElement');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LitElement');
    assert.equal(type.references[0].package, 'lit');
    assert.equal(type.references[0].module, undefined);
    assert.equal(type.references[0].isGlobal, false);
  });

  test('separatelyExportedDestructArr', ({module}) => {
    const type = typeForVariable(module, 'separatelyExportedDestructArr');
    assert.equal(type.text, 'LocalClass');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LocalClass');
    assert.equal(type.references[0].package, '@lit-internal/test-types');
    assert.equal(type.references[0].module, 'module.js');
    assert.equal(type.references[0].isGlobal, false);
  });

  test('separatelyExportedDestructArrNested', ({module}) => {
    const type = typeForVariable(module, 'separatelyExportedDestructArrNested');
    assert.equal(type.text, 'LitElement');
    assert.equal(type.references.length, 1);
    assert.equal(type.references[0].name, 'LitElement');
    assert.equal(type.references[0].package, 'lit');
    assert.equal(type.references[0].module, undefined);
    assert.equal(type.references[0].isGlobal, false);
  });

  test('importedType', ({module}) => {
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

  test('getImportsStringForReferences', ({module}) => {
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

  test.run();
}
