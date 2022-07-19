/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
import {
  isLitElementDeclaration,
  LitElementDeclaration,
} from '../../lib/model.js';

const test = suite<{
  analyzer: Analyzer;
  packagePath: AbsolutePath;
  element: LitElementDeclaration;
}>('LitElement property tests');

test.before((ctx) => {
  try {
    const packagePath = fileURLToPath(
      new URL('../../test-files/decorators-properties', import.meta.url).href
    ) as AbsolutePath;
    const analyzer = new Analyzer(packagePath);

    const result = analyzer.analyzePackage();
    const elementAModule = result.modules.find(
      (m) => m.sourcePath === path.normalize('src/element-a.ts')
    );
    const element = elementAModule!.declarations.filter(
      isLitElementDeclaration
    )[0] as LitElementDeclaration;

    ctx.packagePath = packagePath;
    ctx.analyzer = analyzer;
    ctx.element = element;
  } catch (error) {
    // Uvu has a bug where it silently ignores failures in before and after,
    // see https://github.com/lukeed/uvu/issues/191.
    console.error('uvu before error', error);
    process.exit(1);
  }
});

test('non-decorated fields are not reactive', ({element}) => {
  // TODO(justinfagnani): we might want to change the representation
  // so we have a collection of all fields, some of which are reactive.
  assert.equal(element.reactiveProperties.has('notDecorated'), false);
});

test('string property with no options', ({element}) => {
  const property = element.reactiveProperties.get('noOptionsString');
  assert.ok(property);
  assert.equal(property.name, 'noOptionsString');
  assert.equal(property.attribute, 'nooptionsstring');
  assert.ok(property.type);
  assert.equal(property.type.text, 'string');
  assert.equal(property.type.references.length, 0);
  assert.ok(property.type);
  assert.equal(property.reflect, false);
  assert.equal(property.converter, undefined);
});

test('number property with no options', ({element}) => {
  const property = element.reactiveProperties.get('noOptionsNumber')!;
  assert.equal(property.name, 'noOptionsNumber');
  assert.equal(property.attribute, 'nooptionsnumber');
  assert.ok(property.type);
  assert.equal(property.type.text, 'number');
  assert.equal(property.type.references.length, 0);
  assert.ok(property.type);
});

test('string property with type', ({element}) => {
  const property = element.reactiveProperties.get('typeString')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'string');
  assert.equal(property.type.references.length, 0);
  assert.ok(property.type);
});

test('number property with type', ({element}) => {
  const property = element.reactiveProperties.get('typeNumber')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'number');
  assert.equal(property.type.references.length, 0);
  assert.ok(property.type);
});

test('boolean property with type', ({element}) => {
  const property = element.reactiveProperties.get('typeBoolean')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'boolean');
  assert.equal(property.type.references.length, 0);
  assert.ok(property.type);
});

test('property typed with local class', ({element}) => {
  const property = element.reactiveProperties.get('localClass')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'LocalClass');
  assert.equal(property.type.references.length, 1);
  assert.equal(property.type.references[0].name, 'LocalClass');
  assert.equal(
    property.type.references[0].package,
    '@lit-internal/test-decorators-properties'
  );
  assert.equal(property.type.references[0].module, 'element-a.js');
});

test('property typed with imported class', ({element}) => {
  const property = element.reactiveProperties.get('importedClass')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'ImportedClass');
  assert.equal(property.type.references.length, 1);
  assert.equal(property.type.references[0].name, 'ImportedClass');
  assert.equal(
    property.type.references[0].package,
    '@lit-internal/test-decorators-properties'
  );
  assert.equal(property.type.references[0].module, 'external.js');
});

test('property typed with global class', ({element}) => {
  const property = element.reactiveProperties.get('globalClass')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'HTMLElement');
  assert.equal(property.type.references.length, 1);
  assert.equal(property.type.references[0].name, 'HTMLElement');
  assert.equal(property.type.references[0].isGlobal, true);
});

test('property typed with union', ({element}) => {
  const property = element.reactiveProperties.get('union')!;
  assert.ok(property.type);
  assert.equal(property.type.text, 'ImportedClass | LocalClass | HTMLElement');
  assert.equal(property.type.references.length, 3);
  assert.equal(property.type.references[0].name, 'ImportedClass');
  assert.equal(
    property.type.references[0].package,
    '@lit-internal/test-decorators-properties'
  );
  assert.equal(property.type.references[0].module, 'external.js');
  assert.equal(property.type.references[1].name, 'LocalClass');
  assert.equal(
    property.type.references[1].package,
    '@lit-internal/test-decorators-properties'
  );
  assert.equal(property.type.references[1].module, 'element-a.js');
  assert.equal(property.type.references[2].name, 'HTMLElement');
  assert.equal(property.type.references[2].isGlobal, true);
});

test('reflect: true', ({element}) => {
  const property = element.reactiveProperties.get('reflectTrue')!;
  assert.equal(property.reflect, true);
});

test('reflect: false', ({element}) => {
  const property = element.reactiveProperties.get('reflectFalse')!;
  assert.equal(property.reflect, false);
});

test('reflect: undefined', ({element}) => {
  const property = element.reactiveProperties.get('reflectUndefined')!;
  assert.equal(property.reflect, false);
});

test('attribute: true', ({element}) => {
  const property = element.reactiveProperties.get('attributeTrue')!;
  assert.equal(property.attribute, 'attributetrue');
});

test('attribute: false', ({element}) => {
  const property = element.reactiveProperties.get('attributeFalse')!;
  assert.equal(property.attribute, undefined);
});

test('attribute: undefined', ({element}) => {
  const property = element.reactiveProperties.get('attributeUndefined')!;
  assert.equal(property.attribute, 'attributeundefined');
});

test('attribute: string', ({element}) => {
  const property = element.reactiveProperties.get('attributeString')!;
  assert.equal(property.attribute, 'abc');
});

test('custom converter', ({element}) => {
  const property = element.reactiveProperties.get('customConverter')!;
  assert.ok(property.converter);
});

test.run();
