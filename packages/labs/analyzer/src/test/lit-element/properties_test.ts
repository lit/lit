/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';
import {getSourceFilename, languages} from '../utils.js';

import {
  createPackageAnalyzer,
  Analyzer,
  AbsolutePath,
  LitElementDeclaration,
} from '../../index.js';

for (const lang of languages) {
  const test = suite<{
    analyzer: Analyzer;
    packagePath: AbsolutePath;
    element: LitElementDeclaration;
  }>(`LitElement property tests (${lang})`);

  test.before((ctx) => {
    try {
      const packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/properties`, import.meta.url).href
      ) as AbsolutePath;
      const analyzer = createPackageAnalyzer(packagePath);

      const result = analyzer.getPackage();
      const elementAModule = result.modules.find(
        (m) => m.sourcePath === getSourceFilename('element-a', lang)
      );
      const element = elementAModule?.getDeclaration('ElementA');
      assert.ok(element?.isLitElementDeclaration());

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
    assert.equal(element.getField('noOptionsString')?.type?.text, 'string');
    assert.equal(
      element.getField('noOptionsString')?.type?.references.length,
      0
    );
    assert.equal(property.reflect, false);
    assert.equal(property.converter, undefined);
  });

  test('number property with no options', ({element}) => {
    const property = element.reactiveProperties.get('noOptionsNumber')!;
    assert.equal(property.name, 'noOptionsNumber');
    assert.equal(property.attribute, 'nooptionsnumber');
    assert.equal(element.getField('noOptionsNumber')?.type?.text, 'number');
    assert.equal(
      element.getField('noOptionsNumber')?.type?.references.length,
      0
    );
  });

  test('string property with type', ({element}) => {
    const property = element.getField('typeString')!;
    assert.equal(property.type?.text, 'string');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('number property with type', ({element}) => {
    const property = element.getField('typeNumber')!;
    assert.equal(property.type?.text, 'number');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('boolean property with type', ({element}) => {
    const property = element.getField('typeBoolean')!;
    assert.equal(property.type?.text, 'boolean');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('property typed with local class', ({element}) => {
    const property = element.getField('localClass')!;
    assert.equal(property.type?.text, 'LocalClass');
    assert.equal(property.type?.references.length, 1);
    assert.equal(property.type?.references[0].name, 'LocalClass');
    assert.equal(
      property.type?.references[0].package,
      '@lit-internal/test-properties'
    );
    assert.equal(property.type?.references[0].module, 'element-a.js');
  });

  test('property typed with imported class', ({element}) => {
    const property = element.getField('importedClass')!;
    assert.equal(property.type?.text, 'ImportedClass');
    assert.equal(property.type?.references.length, 1);
    assert.equal(property.type?.references[0].name, 'ImportedClass');
    assert.equal(
      property.type?.references[0].package,
      '@lit-internal/test-properties'
    );
    assert.equal(property.type?.references[0].module, 'external.js');
  });

  test('property typed with global class', ({element}) => {
    const property = element.getField('globalClass')!;
    assert.equal(property.type?.text, 'HTMLElement');
    assert.equal(property.type?.references.length, 1);
    assert.equal(property.type?.references[0].name, 'HTMLElement');
    assert.equal(property.type?.references[0].isGlobal, true);
  });

  test('property typed with union', ({element}) => {
    // TODO(kschaaf): TS seems to have some support for inferring union types
    // from JS initializers, but if there are n possible types (e.g. `this.foo =
    // new A() || new B() || new C()`), it seems to only generate a union type
    // with n-1 types in it (e.g. A | B). For now let's just skip it.
    if (lang === 'js') {
      return;
    }
    const property = element.getField('union')!;
    assert.equal(property.type?.references.length, 3);
    // The order is not necessarily reliable. It changed between TypeScript
    // versions once.

    const localClass = property.type?.references.find(
      (node) => node.name === 'LocalClass'
    );
    assert.ok(localClass);
    assert.equal(localClass.package, '@lit-internal/test-properties');
    assert.equal(localClass.module, 'element-a.js');

    const htmlElement = property.type?.references.find(
      (node) => node.name === 'HTMLElement'
    );
    assert.ok(htmlElement);
    assert.equal(htmlElement.isGlobal, true);

    const importedClass = property.type?.references.find(
      (node) => node.name === 'ImportedClass'
    );
    assert.ok(importedClass);
    assert.equal(importedClass.package, '@lit-internal/test-properties');
    assert.equal(importedClass.module, 'external.js');
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

  test('property defined in static properties block', ({element}) => {
    const property = element.reactiveProperties.get('staticProp')!;
    assert.equal(element.getField('staticProp')?.type?.text, 'number');
    assert.equal(element.getField('staticProp')?.type?.references.length, 0);
    assert.equal(property.typeOption, 'Number');
    assert.equal(property.attribute, 'static-prop');
  });

  test.run();
}
