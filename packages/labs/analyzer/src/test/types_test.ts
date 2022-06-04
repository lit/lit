/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import 'source-map-support/register.js';
import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';

import {Analyzer} from '../lib/analyzer.js';
import {AbsolutePath} from '../lib/paths.js';
import {
  Module,
  Type,
  VariableDeclaration,
  getImportsStringForReferences,
  Reference,
} from '../lib/model.js';

const test = suite<{module: Module; packagePath: AbsolutePath}>('Types tests');

test.before((ctx) => {
  try {
    const packagePath = (ctx.packagePath = fileURLToPath(
      new URL('../test-files/types', import.meta.url).href
    ) as AbsolutePath);
    const analyzer = new Analyzer(packagePath);
    const pkg = analyzer.analyzePackage();
    ctx.module = pkg.modules.filter((m) => m.jsPath === 'module.js')[0];
  } catch (e) {
    // Uvu has a bug where it silently ignores failures in before and after,
    // see https://github.com/lukeed/uvu/issues/191.
    console.error(e);
    process.exit(1);
  }
});

const typeForVariable = (module: Module, name: string) => {
  const dec = module.declarations.filter((dec) => dec.name === name)[0];
  assert.ok(dec, `Could not find symbol named ${name}`);
  assert.instance(dec, VariableDeclaration);
  assert.instance((dec as VariableDeclaration).type, Type);
  return (dec as VariableDeclaration).type!;
};

test('testString', ({module}) => {
  const type = typeForVariable(module, 'testString');
  assert.equal(type.text, 'string');
  assert.equal(type.references.length, 0);
});

test('inferredString', ({module}) => {
  const type = typeForVariable(module, 'inferredString');
  // TODO(kschaaf): Do we want to widen e.g. string literal types to 'string'?
  assert.equal(type.text, '"hi"');
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

test('jsdocString', ({module}) => {
  const type = typeForVariable(module, 'jsdocString');
  assert.equal(type.text, 'string');
  assert.equal(type.references.length, 0);
});

test('jsdocLocalClass', ({module}) => {
  const type = typeForVariable(module, 'jsdocLocalClass');
  assert.equal(type.text, 'LocalClass');
  assert.equal(type.references.length, 1);
  assert.equal(type.references[0].name, 'LocalClass');
  assert.equal(type.references[0].package, '@lit-internal/test-types');
  assert.equal(type.references[0].module, 'module.js');
  assert.equal(type.references[0].isGlobal, false);
});

test('jsdocImportedClass', ({module}) => {
  const type = typeForVariable(module, 'jsdocImportedClass');
  assert.equal(type.text, 'ImportedClass');
  assert.equal(type.references.length, 1);
  assert.equal(type.references[0].name, 'ImportedClass');
  assert.equal(type.references[0].package, '@lit-internal/test-types');
  assert.equal(type.references[0].module, 'external.js');
  assert.equal(type.references[0].isGlobal, false);
});

test('jsdocStringExternalClassUnion', ({module}) => {
  const type = typeForVariable(module, 'jsdocStringExternalClassUnion');
  assert.equal(type.text, 'string | ImportedClass');
  assert.equal(type.references.length, 1);
  assert.equal(type.references[0].name, 'ImportedClass');
  assert.equal(type.references[0].package, '@lit-internal/test-types');
  assert.equal(type.references[0].module, 'external.js');
  assert.equal(type.references[0].isGlobal, false);
});

test('jsdocStringExternalGlobalClassUnion', ({module}) => {
  const type = typeForVariable(module, 'jsdocStringExternalGlobalClassUnion');
  assert.equal(type.text, 'string | ImportedClass | HTMLElement');
  assert.equal(type.references.length, 2);
  assert.equal(type.references[0].name, 'ImportedClass');
  assert.equal(type.references[0].package, '@lit-internal/test-types');
  assert.equal(type.references[0].module, 'external.js');
  assert.equal(type.references[0].isGlobal, false);
  assert.equal(type.references[1].name, 'HTMLElement');
  assert.equal(type.references[1].isGlobal, true);
});

test('complexType', ({module}) => {
  const type = typeForVariable(module, 'complexType');
  assert.equal(type.text, 'Promise<Map<keyof LitElement, ImportedClass[]>>[]');
  assert.equal(type.references.length, 4);
  assert.equal(type.references[0].name, 'Promise');
  assert.equal(type.references[0].isGlobal, true);
  assert.equal(type.references[1].name, 'Map');
  assert.equal(type.references[1].isGlobal, true);
  assert.equal(type.references[2].name, 'LitElement');
  assert.equal(type.references[2].package, 'lit');
  assert.equal(type.references[2].module, '');
  assert.equal(type.references[2].isGlobal, false);
  assert.equal(type.references[3].name, 'ImportedClass');
  assert.equal(type.references[3].package, '@lit-internal/test-types');
  assert.equal(type.references[3].module, 'external.js');
  assert.equal(type.references[3].isGlobal, false);
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
  const referencs = [
    new Reference({package: 'foo', name: 'foo1'}),
    new Reference({package: 'bar', name: 'bar1'}),
    new Reference({package: 'foo', name: 'foo1'}),
    new Reference({package: 'foo', name: 'foo2'}),
    new Reference({package: 'bar', name: 'bar2'}),
    new Reference({package: 'bar', name: 'bar2'}),
    new Reference({package: 'foo', name: 'foo3'}),
  ];
  assert.equal(
    getImportsStringForReferences(referencs),
    `
import {foo1, foo2, foo3} from 'foo';
import {bar1, bar2} from 'bar';
`.trim()
  );
});

test.run();
