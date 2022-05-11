/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
import {LitElementDeclaration} from '../../lib/model.js';

const test = suite<{
  analyzer: Analyzer;
  packagePath: AbsolutePath;
  element: LitElementDeclaration;
}>('LitElement property tests');

test.before((ctx) => {
  const packagePath = fileURLToPath(
    new URL('../../test-files/decorators-properties', import.meta.url).href
  ) as AbsolutePath;
  const analyzer = new Analyzer(packagePath);

  const result = analyzer.analyzePackage();
  const elementAModule = result.modules.find(
    (m) => m.sourcePath === 'src/element-a.ts'
  );
  const element = elementAModule!.declarations[0] as LitElementDeclaration;

  ctx.packagePath = packagePath;
  ctx.analyzer = analyzer;
  ctx.element = element;
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
  assert.equal(property.typeString, 'string');
  assert.ok(property.type);
  assert.equal(property.reflect, false);
  assert.equal(property.converter, undefined);
});

test('number property with no options', ({element}) => {
  const property = element.reactiveProperties.get('noOptionsNumber')!;
  assert.equal(property.name, 'noOptionsNumber');
  assert.equal(property.attribute, 'nooptionsnumber');
  assert.equal(property.typeString, 'number');
  assert.ok(property.type);
});

test('string property with type', ({element}) => {
  const property = element.reactiveProperties.get('typeString')!;
  assert.equal(property.typeString, 'string');
  assert.ok(property.type);
});

test('number property with type', ({element}) => {
  const property = element.reactiveProperties.get('typeNumber')!;
  assert.equal(property.typeString, 'number');
  assert.ok(property.type);
});

test('boolean property with type', ({element}) => {
  const property = element.reactiveProperties.get('typeBoolean')!;
  assert.equal(property.typeString, 'boolean');
  assert.ok(property.type);
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
