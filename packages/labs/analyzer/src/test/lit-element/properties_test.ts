/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  AnalyzerModuleTestContext,
  languages,
  setupAnalyzerForTestWithModule,
} from '../utils.js';

import {LitElementDeclaration} from '../../index.js';
import {DiagnosticCode} from '../../lib/diagnostic-code.js';

interface TestContext extends AnalyzerModuleTestContext {
  element: LitElementDeclaration;
}

for (const lang of languages) {
  const test = suite<TestContext>(`LitElement property tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTestWithModule(ctx, lang, 'properties', 'element-a');
    ctx.element = ctx.module.declarations.find((d) =>
      d.isLitElementDeclaration()
    ) as LitElementDeclaration;
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
    assert.equal(property.type?.text, 'string');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
    assert.equal(property.reflect, false);
    assert.equal(property.converter, undefined);
  });

  test('number property with no options', ({element}) => {
    const property = element.reactiveProperties.get('noOptionsNumber')!;
    assert.equal(property.name, 'noOptionsNumber');
    assert.equal(property.attribute, 'nooptionsnumber');
    assert.equal(property.type?.text, 'number');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('string property with type', ({element}) => {
    const property = element.reactiveProperties.get('typeString')!;
    assert.equal(property.type?.text, 'string');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('number property with type', ({element}) => {
    const property = element.reactiveProperties.get('typeNumber')!;
    assert.equal(property.type?.text, 'number');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('boolean property with type', ({element}) => {
    const property = element.reactiveProperties.get('typeBoolean')!;
    assert.equal(property.type?.text, 'boolean');
    assert.equal(property.type?.references.length, 0);
    assert.ok(property.type);
  });

  test('property typed with local class', ({element}) => {
    const property = element.reactiveProperties.get('localClass')!;
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
    const property = element.reactiveProperties.get('importedClass')!;
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
    const property = element.reactiveProperties.get('globalClass')!;
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
    const property = element.reactiveProperties.get('union')!;
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
    assert.equal(property.type?.text, 'number');
    assert.equal(property.type?.references.length, 0);
    assert.equal(property.typeOption, 'Number');
    assert.equal(property.attribute, 'static-prop');
  });

  test('property with an unsupported name type', ({analyzer, element}) => {
    const diagnostics = Array.from(analyzer.getDiagnostics());
    // This currently results in two diagnostics: one for the
    // `LitElement`-specific part of the analysis and one for the vanilla class
    // analysis.
    assert.equal(diagnostics.length, 2);
    assert.equal(
      diagnostics[0].code,
      DiagnosticCode.UNSUPPORTED_PROPERTY_NAME_TYPE
    );
    assert.equal(
      diagnostics[1].code,
      DiagnosticCode.UNSUPPORTED_PROPERTY_NAME_TYPE
    );

    // Fields named with symbols are not visible in the `fields` iterator.
    const field = Array.from(element.fields).find(
      (x) => x.name === '[unsupportedPropertyName]'
    );
    assert.not(field);

    // Reactive properties named with symbols are not supported.
    const reactiveProperty = element.reactiveProperties.get(
      '[unsupportedPropertyName]'
    );
    assert.not(reactiveProperty);
  });

  test.run();
}
